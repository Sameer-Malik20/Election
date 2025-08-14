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
  const [, setLoading] = useState(true);
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

  const uniqueVotesCount = (votes) => {
    const seenIps = new Set();
    const seenSignatures = new Set();
    let count = 0;

    votes.forEach(({ ip, signature }) => {
      if (!ip && !signature) return; // skip if both missing

      if (!seenIps.has(ip) && !seenSignatures.has(signature)) {
        count++;
        if (ip) seenIps.add(ip);
        if (signature) seenSignatures.add(signature);
      }
    });

    return count;
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
      console.log(data);

      if (res.ok) {
        // Filter verified nominations
        const verifiedNominations = data.filter((n) => n.isVerified === true);

        // Process nominations for unique votes and voteCount
        const cleanNominations = verifiedNominations.map((nom) => {
          // Filter votes with either ip or signature
          const filteredVotes = (nom.votes || []).filter(
            ({ ip, signature }) => ip || signature
          );

          // Calculate unique votes count
          const voteCount = uniqueVotesCount(filteredVotes);

          return {
            ...nom,
            votes: filteredVotes,
            voteCount,
          };
        });

        // Sort nominations by voteCount descending so highest votes first
        cleanNominations.sort((a, b) => b.voteCount - a.voteCount);

        // Mark winner (top voteCount wale ko)
        if (cleanNominations.length > 0) {
          const winnerId = cleanNominations[0]._id;
          cleanNominations.forEach((nom) => {
            nom.isWinner = nom._id === winnerId;
          });
        }

        setNominations(cleanNominations);
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
      console.log("data announcement", data[0].announcement.title);

      const announcement = data?.[0];
      if (!announcement) {
        setError("No announcements found");
        return;
      }

      const votingStartTime = new Date(announcement.createdAt).getTime();

      const VOTING_DURATION = 20 * 60 * 1000; // 5 minutes
      const now = Date.now();

      let countdownEnd = votingStartTime + VOTING_DURATION;

      // Find user's vote time
      let userVoteTime: number | null = null;

      Object.values(data.winners || {}).some((winnerNom) =>
        ((winnerNom as { votes?: any[] }).votes || []).some((vote) => {
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
    fetchAnnouncements();
    fetchNominations();
    getFingerprint();
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
        console.log("data", data);

        const winners = data.winners || {};
        let hasVoted = false;

        // Check if user has voted
        Object.values(winners).some((winnerNom) =>
          ((winnerNom as { votes?: any[] }).votes || []).some((vote) => {
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

        if (hasVoted) {
          setStatus("thanks");
        } else {
          setStatus("waitingForResults");
        }

        // Remove duplicate votes per nomination
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

        // Sort nominations by voteCount descending
        cleanNominations.sort((a, b) => b.voteCount - a.voteCount);

        // Mark winner - top voteCount wala nomination
        if (cleanNominations.length > 0) {
          const winnerId = cleanNominations[0]._id;
          cleanNominations.forEach((nom) => {
            nom.isWinner = nom._id === winnerId;
          });
        }

        setNominations(cleanNominations);
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") setError("Failed to load data");
        console.error(err);
      });
  }, [userId, signature, ip]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setStatus("results");

      if (nominations.length > 0) {
        const nominationsWithVoteCount = nominations.map((nom) => ({
          ...nom,
          voteCount: nom.votes.length,
        }));

        nominationsWithVoteCount.sort((a, b) => b.voteCount - a.voteCount);
        const winner = nominationsWithVoteCount[0];

        setNominations(
          nominationsWithVoteCount.map((nom) => ({
            ...nom,
            isWinner: nom._id === winner._id,
          }))
        );
      }

      return; // stop timer
    }

    const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, nominations]);
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

  if (status === "thanks" || status === "waitingForResults") {
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

  if (status === "results") {
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
              Position: {nomination.title} (Rank: {index + 1})
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      Loading...
    </div>
  );
}
