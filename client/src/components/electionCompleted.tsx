import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Vote {
  ip: string;
  signature: string;
}

interface Nomination {
  _id: string;
  user?: {
    name: string;
  };
  description?: string;
  position?: string;
  votes?: Vote[];
  isVerified?: boolean;
}

export default function CompletedEle() {
  const [, setLoading] = useState(true);
  const [, setMessage] = useState<string>("");
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [, setError] = useState<string>("");

  const fetchNominations = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("accessToken");
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const adminId = userData._id; // current admin ID
      const res = await fetch(
        "http://localhost:5000/api/nomination/getall?type=nominations",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Filter verified nominations
        const verifiedNominations = data.filter((n: any) => {
          const isMatch =
            n.isVerified === true &&
            n.isElectionCompleted === true &&
            n.user &&
            String(n.user.uploadedBy) === adminId;

          return isMatch;
        });

        setNominations(verifiedNominations);
        setMessage("Verified nominations loaded successfully!");
      } else {
        setError(data.message || "Failed to fetch nominations");
      }
    } catch (err) {
      console.error("Error fetching nominations:", err);
      setError("Error fetching nominations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNominations();
  }, []);
  const groupedNominations = nominations.reduce((acc, n) => {
    const pos = n.position || "Unknown Position";
    if (!acc[pos]) {
      acc[pos] = [];
    }
    acc[pos].push(n);
    return acc;
  }, {});

  return (
    <div>
      {Object.keys(groupedNominations).length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-6">
          No election found
        </p>
      ) : (
        Object.keys(groupedNominations).map((position) => (
          <div
            key={position}
            className="mt-8 p-6 bg-gray-50 rounded-lg shadow-md"
          >
            <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800 border-b pb-3 border-gray-300">
              {position} Candidates
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-lg border border-gray-300 table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Candidate Resolution
                    </th>
                    <th className="px-4 py-3 border-b border-gray-300 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Votes Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groupedNominations[position].map((n) => {
                    const uniqueVotesCount = (votes) => {
                      const seenIps = new Set();
                      const seenSignatures = new Set();
                      let count = 0;
                      votes.forEach(({ ip, signature }) => {
                        if (
                          !seenIps.has(ip) &&
                          !seenSignatures.has(signature)
                        ) {
                          count++;
                          seenIps.add(ip);
                          seenSignatures.add(signature);
                        }
                      });
                      return count;
                    };

                    return (
                      <tr
                        key={n._id}
                        className="hover:bg-gray-50 transition duration-200"
                      >
                        <td className="px-4 py-3 border-b border-gray-200 text-gray-800 font-medium">
                          {n.user?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200 text-gray-600">
                          {n.description || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200 text-center font-semibold text-lg text-blue-600 cursor-pointer">
                          <Link to={`/admin/candidate-votes/${n._id}`}>
                            {uniqueVotesCount(n.votes)} Vote
                            {uniqueVotesCount(n.votes) !== 1 ? "s" : ""}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
