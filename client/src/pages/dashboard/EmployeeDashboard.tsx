import { useEffect, useState } from "react";
import { clearAuthTokens } from "../../utlis/auth"; // Logout Helper
import { useNavigate } from "react-router-dom";

interface Nomination {
  _id: string;
  user?: { name: string };
  description: string;
  position: string;
  isVerified: boolean;
}

export default function EmployeeDashboard() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min in seconds
  const navigate = useNavigate();

  // Countdown Timer for Session Expiry
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearAuthTokens(); // Remove tokens
          alert("Session expired! Please login again.");
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  // Fetch nominations from API
  useEffect(() => {
    const fetchNominations = async () => {
      setLoading(true);
      setError("");
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
          const verifiedNominations = data.filter(
            (n: Nomination) => n.isVerified
          );
          setNominations(verifiedNominations);
        } else {
          setError(data.message || "Failed to fetch nominations");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching nominations");
      } finally {
        setLoading(false);
      }
    };
    fetchNominations();
  }, []);

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Your Dashboard</h2>
      </div>

      <div className="text-right text-sm text-gray-500">
        Session Time Left: {formatTime(timeLeft)}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <>
          {/* Motivational message */}
          <div className="bg-blue-50 p-4 rounded shadow">
            <h3 className="text-lg font-semibold text-blue-800">
              Voting is live! So far, {nominations.length} candidates have been
              nominated. Cast your vote and make your voice heard!
            </h3>
          </div>

          {/* Nominations List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Candidates for Voting
              </h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {nominations.length === 0 ? (
                <p className="p-4 text-gray-600">
                  No verified nominations available yet.
                </p>
              ) : (
                nominations.map((nom) => (
                  <div key={nom._id} className="px-6 py-4">
                    <p className="font-semibold text-gray-800">
                      {nom.user?.name || "Unknown Candidate"}
                    </p>
                    <p className="text-gray-600 italic">
                      Bio: {nom.description}
                    </p>
                    <p className="text-sm text-gray-400 italic">
                      Position: {nom.position}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
