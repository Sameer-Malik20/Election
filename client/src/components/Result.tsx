import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useNavigate } from "react-router-dom";

export default function ResultPage() {
  const [status, setStatus] = useState("loading"); // "thanks" | "results" | null
  const [timeLeft, setTimeLeft] = useState(0); // seconds countdown
  const [nominations, setNominations] = useState([]);
  const [error, setError] = useState(null);

  const [userId, setUserId] = useState(null);
  const [signature, setSignature] = useState(null);
  const [ip, setIp] = useState(null);
  const [, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setMessage] = useState("");
  const navigate = useNavigate();
  const [, setTotalUsers] = useState(0);

  // Total users count effect
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/count", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setTotalUsers(data.totalUsers));
  }, []);

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
      console.log("only", data[0]);

      if (res.ok) {
        // Filter verified nominations
        // 1. Filter verified and completed nominations
        const verifiedNominations = data.filter(
          (n) => n.isVerified && n.isElectionCompleted && n.user
        );

        // 2. Map nominations and calculate voteCount
        const cleanNominations = verifiedNominations.map((nom) => {
          const filteredVotes = (nom.votes || []).filter(
            ({ ip, signature }) => ip || signature
          );

          const voteCount = filteredVotes.length; // ya uniqueVotesCount(filteredVotes)

          return {
            ...nom,
            votes: filteredVotes,
            voteCount,
          };
        });

        // 3. Sort descending by votes
        cleanNominations.sort((a, b) => b.voteCount - a.voteCount);

        // 4. Mark winner per position
        if (cleanNominations.length > 0) {
          console.log(cleanNominations);
          setNominations([cleanNominations[0]]);
          console.log("only first", cleanNominations[0]);
        } else {
          setNominations([]);
        }

        // 5. Set state

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

  const fetchAnnouncements = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:5000/api/auth/published", {
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

      const announcement = data?.[0];
      if (!announcement) {
        setError("No announcements found");
        return;
      }

      const votingStartTime = new Date(announcement.createdAt).getTime();
      const VOTING_DURATION = 24 * 60 * 60 * 1000; // 15 minutes
      const now = Date.now();

      let countdownEnd = votingStartTime + VOTING_DURATION;

      // Find user's vote time
      let userVoteTime: number | null = null;

      Object.values(data.winners || {}).some((winnerNom) =>
        (Array.isArray((winnerNom as { votes?: any[] }).votes)
          ? (winnerNom as { votes?: any[] }).votes
          : []
        ).some((vote) => {
          const voteUserId = vote.user?._id || "";
          const voteSignature = vote.signature || "";
          const voteIp = vote.ip || "";

          if (
            voteUserId === userId ||
            voteSignature === signature ||
            voteIp === ip
          ) {
            userVoteTime = new Date(
              vote.createdAt || vote.timestamp || now
            ).getTime();
            return true;
          }
          return false;
        })
      );

      if (userVoteTime) {
        countdownEnd = userVoteTime + VOTING_DURATION;
      }

      const timeLeftMs = countdownEnd - now;
      const secondsLeftFromServer = Math.max(0, Math.floor(timeLeftMs / 1000));
      setTimeLeft(secondsLeftFromServer);

      if (secondsLeftFromServer === 0) {
        setStatus("results");
      } else if (userVoteTime) {
        setStatus("thanks");
      } else {
        setStatus("waitingForResults");
      }

      if (res.ok) {
        setAnnouncements(data);
      } else {
        setError(data.message || "Failed to fetch announcements");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Error fetching announcements");
    } finally {
      setLoading(false);
    }
  };

  // Get IP
  useEffect(() => {
    fetch("https://ipinfo.io/json")
      .then((res) => res.json())
      .then((data) => setIp(data.ip))
      .catch(() => setIp(null));
  }, []);

  // Get machine fingerprint
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setSignature(result.visitorId);
    };
    getFingerprint();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchNominations();
  }, []);

  // Get userId from localStorage
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("User not authenticated");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const storedUserId = userData._id;

    if (storedUserId) setUserId(storedUserId);
    else setError("User ID not found");
  }, []);

  // Fetch results and check voting
  useEffect(() => {
    if (!userId || !signature || !ip) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("User not authenticated");
      return;
    }

    fetch("http://localhost:5000/api/auth/result", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          setError("Unauthorized - Please login again");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        console.log("result", data);

        const winners = data.winners || {};
        let hasVoted = false;

        // Check if user has voted
        Object.values(winners).some((winnerNom) =>
          (Array.isArray((winnerNom as { votes?: any[] }).votes)
            ? (winnerNom as { votes?: any[] }).votes
            : []
          ).some((vote) => {
            const voteUserId = vote.user?._id || "";
            const voteSignature = vote.signature || "";
            const voteIp = vote.ip || "";

            if (
              voteUserId === userId ||
              voteSignature === signature ||
              voteIp === ip
            ) {
              hasVoted = true;
              return true;
            }
            return false;
          })
        );

        // nominations cleanup
        const cleanNominations = (data.nominations || []).map((nom) => {
          const uniqueVoters = new Set();
          const uniqueVotes = [];

          (nom.votes || []).forEach((vote) => {
            const voterId =
              vote.user?._id || vote.id || vote.signature || vote.ip;
            if (voterId && !uniqueVoters.has(voterId)) {
              uniqueVoters.add(voterId);
              uniqueVotes.push(vote);
            }
          });

          return { ...nom, votes: uniqueVotes, voteCount: uniqueVotes.length };
        });

        cleanNominations.sort((a, b) => b.voteCount - a.voteCount);

        // Mark winner if status is "results"
        if (data.status === "results" && cleanNominations.length > 0) {
          const winnerId = cleanNominations[0]._id;
          cleanNominations.forEach((nom) => {
            nom.isWinner = nom._id === winnerId;
          });
        }

        if (Array.isArray(data.nominations) && data.nominations.length > 0) {
          setNominations(cleanNominations);
        }
        // Set status based on backend
        if (data.status === "results") {
          setStatus("results"); // backend says results are ready
        } else if (hasVoted) {
          setStatus("thanks");
        } else {
          setStatus("waitingForResults");
        }
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") setError("Failed to load data");
        console.error(err);
      });
  }, [userId, signature, ip]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Countdown khatam → status update
          if (status === "thanks" || status === "waitingForResults") {
            setStatus("results");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, status]);

  // Only timeLeft as dependency

  const formatTime = (secs) => {
    const days = Math.floor(secs / (24 * 3600));
    secs %= 24 * 3600;
    const hours = Math.floor(secs / 3600);
    secs %= 3600;
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  // Show countdown first
  if (timeLeft > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2">Thanks for voting!</h2>
        <p className="text-gray-600 mb-4">
          Results will be declared in {formatTime(timeLeft)}
        </p>
        {status === "waitingForResults" && (
          <p className="text-gray-600">
            Please wait for results to be declared.
          </p>
        )}
      </div>
    );
  }

  // After countdown finished, show results or loading
  if (timeLeft === 0) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <p className="text-gray-600">Loading results...</p>
        </div>
      );
    }

    if (nominations.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <p className="text-gray-600">No results available.</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h2 className="text-2xl font-bold mb-6">Election Results</h2>
        {nominations.map((nomination, index) => (
          <div
            key={nomination._id}
            className={`bg-white rounded-lg shadow p-4 mb-4 border ${
              nomination.isWinner ? "border-green-600" : "border-gray-200"
            }`}
          >
            <h3 className="font-semibold text-lg mb-2">
              Position: {nomination.position} (Rank: {index + 1})
            </h3>
            <p
              className={`font-bold ${
                nomination.isWinner ? "text-green-700" : "text-gray-700"
              }`}
            >
              Winner: {nomination.user?.name || "Unknown"}
            </p>
            <p className="text-gray-500 text-sm">
              Total Votes: {nomination.voteCount}
            </p>
          </div>
        ))}
      </div>
    );
  }
}
