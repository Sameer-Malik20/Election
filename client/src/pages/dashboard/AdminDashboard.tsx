import { useEffect, useState, type JSX } from "react";

interface StatsCard {
  title: string;
  value: string | number;
  icon: JSX.Element;
  change: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [nominations, setNominations] = useState([]);
  const [message, setMessage] = useState("");
  const [ip, setIp] = useState("Fetching...");
  const [signature, setSignature] = useState("Fetching...");

  // Assuming a function handleVote executes the fetch
  const handleVote = async () => {
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(
        "http://localhost:5000/api/nomination/vote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nominationId: selectedCandidate,
            position: positionList,
            signature: signature,
            ip: ip,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Vote submission failed");
      }

      // Vote successful, now update the "Users Voted" count
      setStats((prevStats) =>
        prevStats.map((stat) => {
          if (stat.title === "Users Voted") {
            // Increment the count by 1
            const newCount = stat.value + 1; // assuming value is number
            return {
              ...stat,
              value: newCount,
            };
          }
          return stat;
        })
      );
    } catch (err) {
      console.error("Error voting:", err);
    }
  };
  const fetchNominations = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
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
        // ✅ Filter verified nominations
        const verifiedNominations = data.filter((n) => n.isVerified === true);

        // ✅ Optional: extract only names
        const verifiedUserNames = verifiedNominations.map((n) => n.user?.name);

        setNominations(verifiedNominations);
        setMessage("Verified nominations loaded successfully!");
      } else {
        setError(data.message || "Failed to fetch nominations");
      }
    } catch (err) {
      console.error("Error fetching nominations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("https://ipinfo.io/json")
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) {
          setIp(data.ip);
        } else {
          setIp("Could not fetch IP");
        }
      })
      .catch(() => {
        setIp("Error fetching IP");
      });
  }, []);

  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setSignature(result.visitorId);
    };
    getFingerprint();
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    fetch("http://localhost:5000/api/auth/count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTotalUsers(data.totalUsers); // Assuming API returns { totalUsers: number }
      })
      .catch((err) => {
        console.error("Fetch error:", err.message);
        setError(err.message);
      });
    fetchNominations();
  }, []);

  const voterCount = new Set(
    nominations
      .flatMap((n) =>
        (n.votes || [])
          .filter((v) => v.user?.name !== "NOTA")
          .map((v) => `${v.machineId}-${v.ipAddress}`)
      )
      .filter(Boolean)
  ).size;

  const userRemaining = totalUsers - voterCount;
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const mockStats: StatsCard[] = [
          {
            title: "Total Users",
            value: totalUsers,
            icon: (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ),
            change: 12,
          },
          {
            title: "User Voted",
            value: voterCount,
            icon: (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            change: 8,
          },
          {
            title: "User Remaining",
            value: userRemaining,
            icon: (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            ),
            change: -3,
          },
        ];

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStats(mockStats);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [totalUsers, voterCount, userRemaining]); // Re-run when totalUsers updates

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Admin Dashboard Overview
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      index % 4 === 0
                        ? "bg-indigo-100 text-indigo-600"
                        : index % 4 === 1
                        ? "bg-green-100 text-green-600"
                        : index % 4 === 2
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Candidates and Votes List */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800 border-b pb-3 border-gray-300">
              Candidates & Votes
            </h3>
            {nominations.length === 0 ? (
              <p className="text-center text-gray-500 italic mt-4">
                No nominations available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-lg border border-gray-300 table-auto">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Candidate Name
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Candidate Bio
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-4 py-3 border-b border-gray-300 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Votes Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {nominations.map((n, index) => {
                      const uniqueVotes = new Set(
                        (n.votes || [])
                          .filter((v) => v.user?.name !== "NOTA")
                          .map((v) => `${signature}-${ip}`)
                      );

                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition duration-200"
                        >
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-800 font-medium">
                            {n.user?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-600">
                            {n.description || "N/A"}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-800">
                            {n.position || "N/A"}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200 text-center font-semibold text-lg text-blue-600">
                            {uniqueVotes.size}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
