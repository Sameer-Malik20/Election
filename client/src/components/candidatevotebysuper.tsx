import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Vote {
  ip: string;
  signature: string;
  user: { name: string; phone: string; email: string } | null; // Fallback to null
}

const CandidateVotesbySuper = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [candidateName, setCandidateName] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:5000/api/auth/${candidateId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        if (data.votes) {
          setVotes(data.votes);
          setCandidateName(data.user?.name || "Candidate");
        } else if (data.nomination) {
          setVotes(data.nomination.votes || []);
          setCandidateName(data.nomination.user?.name || "Candidate");
        }
      }
      setLoading(false);
    };
    fetchVotes();
  }, [candidateId, navigate]);

  const getUniqueVotes = (votes: Vote[]): Vote[] => {
    const seenIps = new Set<string>();
    const seenSignatures = new Set<string>();
    const uniqueVotes: Vote[] = [];

    for (const vote of votes) {
      if (!seenIps.has(vote.ip) && !seenSignatures.has(vote.signature)) {
        uniqueVotes.push(vote);
        seenIps.add(vote.ip);
        seenSignatures.add(vote.signature);
      }
    }
    return uniqueVotes;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex flex-col">
      <div className="w-full flex flex-col items-center py-8">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-6xl border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-700 text-center mb-2">
            Votes for <span className="text-blue-900">{candidateName}</span>
          </h2>
          <div className="text-center text-sm text-gray-500 mb-6">
            All users who voted for this candidate
          </div>
          {loading ? (
            <div className="text-center text-blue-500 py-8 animate-pulse">
              Loading votes...
            </div>
          ) : votes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No votes found for this candidate.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full border border-blue-100 rounded-lg bg-blue-50 text-xs">
                <thead>
                  <tr className="bg-blue-200 text-blue-900">
                    <th className="px-4 py-2 border-b border-blue-100 text-left w-16">
                      #
                    </th>
                    <th className="px-4 py-2 border-b border-blue-100 text-left">
                      IP Address
                    </th>
                    <th className="px-4 py-2 border-b border-blue-100 text-left">
                      Machine Signature
                    </th>
                    <th className="px-4 py-2 border-b border-blue-100 text-left">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getUniqueVotes(votes).map((v, idx) => (
                    <tr key={idx} className="even:bg-blue-100">
                      <td className="px-4 py-2 border-b border-blue-50 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2 border-b border-blue-50">
                        {v.ip}
                      </td>
                      <td className="px-4 py-2 border-b border-blue-50">
                        {v.signature}
                      </td>
                      <td className="px-4 py-2 border-b border-blue-50">
                        {candidateName || "N/A"}{" "}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg w-full font-semibold hover:bg-blue-700 transition"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateVotesbySuper;
