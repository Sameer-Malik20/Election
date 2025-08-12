import { useEffect, useState, type JSX } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { Link } from "react-router-dom";

interface StatsCard {
  title: string;
  value: string | number;
  icon: JSX.Element;
  change: number;
}

interface Vote {
  user?: {
    name: string;
  };
  machineId: string;
  ipAddress: string;
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [, setMessage] = useState<string>("");
  const [, setIp] = useState<string>("Fetching...");
  const [, setSignature] = useState<string>("Fetching...");
  const [, setMockStats] = useState<StatsCard[]>([]);
  const [selectedCandidate] = useState<number | null>(null);

  // Assume selectedCandidate and positionList are defined somewhere in your code

  // handleVote function, if needed later, can be restored here
  // const handleVote = async () => {

  const fetchNominations = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        "https://election-4j7k.onrender.com/api/nomination/getall?type=nominations",
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
        const verifiedNominations = data.filter(
          (n: Nomination) => n.isVerified === true
        );
        setNominations(verifiedNominations);
        setMessage("Verified nominations loaded successfully!");
      } else {
        setError(data.message || "Failed to fetch nominations");
      }
      setMockStats(stats);
    } catch (err) {
      console.error("Error fetching nominations:", err);
      setError("Error fetching nominations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch IP info
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
    // Fetch fingerprint
    const getFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setSignature(result.visitorId);
      } catch {
        setSignature("Unknown");
      }
    };
    getFingerprint();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch("https://election-4j7k.onrender.com/api/auth/count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTotalUsers(data.totalUsers || 0);
        console.log(data);
      })
      .catch((err) => {
        console.error("Fetch error:", err.message);
        setError(err.message);
      });

    fetchNominations();
  }, []);

  // Calculate voter count
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

  // Mock dashboard stats
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
  }, [totalUsers, voterCount, userRemaining]);

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
                      {stat.title === "Total Users" ? (
                        <Link
                          to="/admin/usersdetails"
                          className="text-blue-600 hover:underline"
                        >
                          {stat.value}
                        </Link>
                      ) : (
                        stat.value
                      )}
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

          {/* Candidates & Votes Table */}
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
                    {nominations.map((n) => {
                      const uniqueVotesCount = (votes) => {
                        const seenIps = new Set();
                        const seenSignatures = new Set();
                        let count = 0;

                        votes.forEach(({ ip, signature }) => {
                          if (selectedCandidate === 0) return;

                          if (
                            !seenIps.has(ip) &&
                            !seenSignatures.has(signature)
                          ) {
                            // Agar IP ya signature dono abhi tak nahi aaye, tabhi count badhao
                            count++;
                            seenIps.add(ip);
                            seenSignatures.add(signature);
                          }
                          // Agar IP ya signature pahle se mila to skip karo (duplicate)
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
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-800">
                            {n.position || "N/A"}
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
