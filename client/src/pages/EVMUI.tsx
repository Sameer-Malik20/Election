"use client";

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { Link } from "react-router-dom";

const AdvancedCorporateEVM = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(
    null
  );
  const [votedPositions, setVotedPositions] = useState({
    MANAGER: false,
    CEO: false,
    DIRECTOR: false,
    CTO: false,
  });
  const [activePosition, setActivePosition] = useState("Select");

  const [showCompletion, setShowCompletion] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isVoting, setIsVoting] = useState(false);
  const [voteProgress, setVoteProgress] = useState(0);
  const [showCandidateDetails, setShowCandidateDetails] = useState<
    number | null
  >(null);
  const [votedCandidates, setVotedCandidates] = useState<{
    [key in "MANAGER" | "CEO" | "DIRECTOR" | "CTO"]?: number;
  }>({});
  const [isVotingComplete, setIsVotingComplete] = useState(false);
  const [speed, setSpeed] = useState("Testing...");
  const [ip, setIp] = useState("Fetching...");
  const [signature, setSignature] = useState("Fetching...");
  const [gps, setGps] = useState("Fetching...");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [myNomination, setMyNomination] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showVotes, setShowVotes] = useState<string | null>(null);

  //fetch positions
  const fetchAnnouncements = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:5000/api/auth/published", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setAnnouncements(data);
      } else {
        setError(data.message || "Failed to fetch announcements");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  //fetch users nomination
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

  // Update time every second

  useEffect(() => {
    navigator.getBattery?.().then((bat) => {
      const updateBattery = () => setBatteryLevel(Math.round(bat.level * 100));

      updateBattery();
      const interval = setInterval(updateBattery, 1000);
      return () => clearInterval(interval);
    });
  }, []);

  //ip address
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
  //machine fingerprint
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setSignature(result.visitorId);
    };
    getFingerprint();
    fetchAnnouncements();
    fetchNominations();
  }, []);

  //Internet Speed
  useEffect(() => {
    const testSpeed = () => {
      const img = new Image();
      const fileSizeKB = 50;
      const start = Date.now();
      img.src =
        "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png?cache=" +
        Math.random();
      img.onload = () => {
        const end = Date.now();
        const duration = (end - start) / 1000;
        const speedMbps = (fileSizeKB * 8) / duration / 1024;
        setSpeed(speedMbps.toFixed(2) + " Mbps");
      };
      img.onerror = () => setSpeed("Failed to test");
    };
    const interval = setInterval(testSpeed, 1000);
    testSpeed();
    return () => clearInterval(interval);
  }, []);

  //gps location
  useEffect(() => {
    const fetchGPS = () => {
      if (!navigator.geolocation) return setGps("Geolocation not supported");

      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude: lat, longitude: lng, altitude } }) => {
          let alt = altitude;
          if (alt == null) {
            try {
              const r = await fetch(
                `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
              );
              alt = (await r.json()).results[0].elevation ?? null;
            } catch {
              alt = null;
            }
          }
          const altFeet = isNaN(alt)
            ? "Not available"
            : (alt * 3.28084).toFixed(1);
          setGps(`${lat.toFixed(5)},${lng.toFixed(5)},${altFeet} ft`);
        },
        () => setGps("Permission denied"),
        { enableHighAccuracy: true }
      );
    };

    fetchGPS();
  }, []);

  // Enhanced sound effects
  const playBeep = () => {
    try {
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const playSuccess = () => {
    try {
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(523.25, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1046.5,
        context.currentTime + 0.3
      );
      gainNode.gain.value = 0.15;
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const handleVote = async () => {
    if (selectedCandidate !== null) {
      setIsVoting(true);
      setVoteProgress(0);
      playSuccess();

      // Vote process simulation
      for (let i = 0; i <= 100; i += 10) {
        setVoteProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Vote record karna: position ke saath candidate ki ID store karna
      const newVotedCandidates = {
        ...votedCandidates,
        [activePosition]: selectedCandidate,
      };
      setVotedCandidates(newVotedCandidates);

      // Update votedPositions
      const newVotedPositions = {
        ...votedPositions,
        [activePosition]: true,
      };
      setVotedPositions(newVotedPositions);

      // Get dynamic position list from announcements
      const positionList = [
        ...new Set(
          announcements.map((item) => item.announcement?.title).filter(Boolean)
        ),
      ];

      // Check if all voted
      const allVoted = positionList.every((pos) => newVotedPositions[pos]);
      if (allVoted) {
        setShowCompletion(true);
        setIsVotingComplete(true);
      } else {
        // Find next position (after current)
        const currentIdx = positionList.indexOf(activePosition);
        const nextPosition = positionList.find(
          (pos, idx) => idx > currentIdx && !newVotedPositions[pos]
        );
        if (nextPosition) {
          setActivePosition(nextPosition);
        }
        setSelectedCandidate(null);
      }
      setIsVoting(false);
      setVoteProgress(0);

      // Vote API call

      const token = localStorage.getItem("accessToken");

      await fetch("http://localhost:5000/api/nomination/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nominationId: selectedCandidate,
          position: positionList,
          signature: signature, // from FingerprintJS
          ip: ip,
        }),
      });
    }
  };

  const resetVote = () => {
    setSelectedCandidate(null);
    setVotedPositions({
      MANAGER: false,
      CEO: false,
      DIRECTOR: false,
      CTO: false,
    });
    setVotedCandidates({});
    setActivePosition("MANAGER");
    setShowCompletion(false);
    setBatteryLevel(100);
    setShowCandidateDetails(null);
    setIsVoting(false);
    setIsVotingComplete(false);
  };

  const handleCandidateSelect = (id: number) => {
    if (!isVoting) {
      setSelectedCandidate(id);
      playBeep();
    }
  };

  const isPositionDisabled = (
    position: "MANAGER" | "CEO" | "DIRECTOR" | "CTO"
  ) => {
    return isVoting || isVotingComplete;
  };

  const getVotedCount = () => {
    return Object.values(votedPositions).filter((voted) => voted).length;
  };

  const getPositionDisplayName = (position: string) => {
    return position;
  };

  useEffect(() => {
    if (Array.isArray(announcements) && announcements.length > 0) {
      const firstPosition = [
        ...new Set(
          announcements.map((item) => item.announcement?.title).filter(Boolean)
        ),
      ][0];
      if (firstPosition && activePosition !== firstPosition) {
        setActivePosition(firstPosition);
        setSelectedCandidate(null);
      }
    }
  }, [announcements]);

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

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-100 to-blue-50 p-2 sm:p-3">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Header */}
        <div className="lg:hidden mb-3">
          <div className="bg-white rounded-lg shadow-lg p-3">
            <div className="text-center">
              <h1 className="text-base font-bold text-gray-800">
                Corporate Election System
              </h1>
              <div className="text-xs text-gray-600 mt-1">
                Electronic Voting Machine
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Main EVM Unit */}
          <div className="flex-1">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-700">
              {/* Desktop Header */}
              <div className="hidden lg:block bg-gradient-to-r from-blue-600 via-slate-700 to-purple-600 p-1">
                <div className="bg-gray-800 mx-1 rounded">
                  <div className="text-center py-3 px-4">
                    <div className="text-blue-400 font-bold text-lg tracking-wider">
                      CORPORATE ELECTION SYSTEM
                    </div>
                    <div className="text-white font-bold text-xs mt-1">
                      ELECTRONIC VOTING MACHINE
                    </div>
                    <div className="text-purple-400 font-mono text-xs mt-1">
                      SECURE • TRANSPARENT • EFFICIENT
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-gray-700 px-3 py-1.5 flex flex-wrap justify-between items-center text-xs font-mono gap-2">
                <div className="flex items-center space-x-3">
                  <div className="text-green-400 flex items-center">
                    <span className="mr-1">🔋</span>
                    <span className="hidden sm:inline">Battery: </span>
                    <span>{Math.round(batteryLevel)}%</span>
                  </div>
                  <div className="text-blue-400 flex items-center">
                    <span className="mr-1">📅</span>
                    <span className="hidden sm:inline">
                      {currentTime.toLocaleDateString()}
                    </span>
                    <span className="sm:hidden">
                      {currentTime.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="text-yellow-400 flex items-center">
                    <span className="mr-1">🕐</span>
                    <span>
                      {currentTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-yellow-400 flex items-center">
                    <span className="mr-1">📶</span>
                    <span>{speed}</span>
                  </div>
                </div>
                <div className="text-white">
                  <span className="hidden sm:inline">VOTES: </span>
                  <span>
                    {getVotedCount()}/
                    {
                      [
                        ...new Set(
                          announcements
                            .map((item) => item.announcement?.title)
                            .filter(Boolean)
                        ),
                      ].length
                    }{" "}
                  </span>
                </div>
              </div>

              {/* Main Display Area */}
              <div className="bg-gray-100 p-3 min-h-[350px] sm:min-h-[400px]">
                {showCompletion ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="text-green-600 text-5xl sm:text-6xl mb-3 animate-bounce">
                      ✅
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                      VOTING COMPLETED
                    </h2>
                    <p className="text-gray-600 mb-4 text-sm">
                      Your votes have been successfully recorded
                      <br />
                      Thank you for participating in the corporate election
                    </p>
                    {/* Total users and voted users */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 w-full max-w-sm">
                      <div className="text-xs text-blue-800 space-y-1">
                        <div>
                          <strong>Total Users:</strong> {totalUsers} <br />
                          <strong>Users Who Haven't Voted:</strong>{" "}
                          {totalUsers -
                            new Set(
                              nominations
                                .flatMap((n) =>
                                  (n.votes || [])
                                    .filter((v) => v.user?.name !== "NOTA")
                                    .map((v) => `${v.machineId}-${v.ipAddress}`)
                                )
                                .filter(Boolean)
                            ).size}
                        </div>
                        <div>
                          <strong>Users Voted:</strong>{" "}
                          {
                            new Set(
                              nominations
                                .flatMap((n) =>
                                  (n.votes || [])
                                    .filter((v) => v.user?.name !== "NOTA")
                                    .map((v) => `${v.machineId}-${v.ipAddress}`)
                                )
                                .filter(Boolean)
                            ).size
                          }
                        </div>
                      </div>
                    </div>

                    {/* Candidate vote count per position */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 w-full max-w-sm">
                      <div className="text-xs text-green-800 space-y-2">
                        {[
                          ...new Set(
                            announcements
                              .map((item) => item.announcement?.title)
                              .filter(Boolean)
                          ),
                        ].map((position) => {
                          const filteredNoms = nominations.filter(
                            (n) => n.position === position
                          );

                          // selectedVotes is assumed object: { positionName: selectedCandidateId }
                          // Unique votes count function
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
                            <div key={position}>
                              {filteredNoms.map((n) => {
                                return (
                                  <div
                                    key={n._id}
                                    className="flex items-center justify-between mb-2 px-3 py-2 bg-green-100 rounded-md shadow-sm hover:bg-green-200 transition"
                                  >
                                    <span className="font-medium text-green-800">
                                      {n.user?.name || "Unknown"}{" "}
                                      <span className="text-sm text-green-600 font-normal">
                                        ({getPositionDisplayName(n.position)})
                                      </span>
                                    </span>
                                    <span className="bg-blue-100 px-3 py-1 rounded text-xs cursor-pointer hover:bg-blue-200 font-semibold text-blue-800">
                                      <Link
                                        to={`/employee/candidate-votes/${n._id}`}
                                      >
                                        {uniqueVotesCount(n.votes)} Vote
                                        {uniqueVotesCount(n.votes) !== 1
                                          ? "s"
                                          : ""}
                                      </Link>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={resetVote}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg transition-all duration-200 text-sm"
                    >
                      NEW SESSION
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Position Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg shadow-lg">
                      <div className="text-center">
                        <div className="text-xs opacity-90">POSITION</div>
                        <div className="text-base sm:text-lg font-bold">
                          {getPositionDisplayName(activePosition)}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          Select your preferred candidate
                        </div>
                      </div>
                    </div>

                    {/* Voting Instructions */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <div className="text-xs text-yellow-800 text-center">
                        {isVoting ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                            <span>Recording Vote... {voteProgress}%</span>
                          </div>
                        ) : (
                          "Select candidate and confirm your vote"
                        )}
                      </div>
                      {isVoting && (
                        <div className="mt-2">
                          <div className="w-full bg-yellow-200 rounded-full h-1.5">
                            <div
                              className="bg-yellow-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${voteProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Candidates List (Verified for Active Position) */}
                    <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto">
                      {Array.isArray(nominations) &&
                      nominations.filter((n) => n.position === activePosition)
                        .length > 0 ? (
                        nominations
                          .filter((n) => n.position === activePosition)
                          .map((n, idx) => {
                            // Check if this candidate is voted for this position
                            const isVotedCandidate =
                              votedCandidates[activePosition] === n._id &&
                              votedPositions[activePosition];
                            // Check if this candidate is currently selected
                            const isSelectedCandidate =
                              selectedCandidate === n._id;

                            return (
                              <div
                                key={n._id}
                                className={`relative border-2 rounded-lg p-2.5 cursor-pointer transition-all duration-200 transform hover:scale-[1.01] shadow-lg
              ${
                isVotedCandidate
                  ? "border-green-600 bg-green-50 ring-2 ring-green-500"
                  : isSelectedCandidate
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500"
                  : "border-gray-300 bg-white"
              }
            `}
                                onClick={() => handleCandidateSelect(n._id)}
                                onDoubleClick={() =>
                                  setShowCandidateDetails(n._id)
                                }
                              >
                                <div className="flex items-center space-x-3">
                                  {/* Numbering */}
                                  <span className="font-bold text-blue-600">
                                    {idx + 1}.
                                  </span>
                                  {/* Candidate Image */}
                                  {n.image && (
                                    <img
                                      src={n.image}
                                      alt={n.user?.name}
                                      className="w-10 h-10 rounded-full object-cover border"
                                    />
                                  )}
                                  <div>
                                    <span className="font-semibold text-gray-800">
                                      {n.user?.name}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      {n.description}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {n.party}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {n.symbol}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {n.experience}
                                    </div>
                                  </div>
                                  <span className="text-xs text-green-600 ml-auto">
                                    Verified
                                  </span>
                                  {isVotedCandidate && (
                                    <span className="ml-2 text-green-600 font-bold text-lg">
                                      ✓
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-gray-500 text-sm">
                          No verified candidates for this position.
                        </div>
                      )}
                      {/* NOTA Option */}
                      <div
                        className={`relative border-2 rounded-lg p-2.5 cursor-pointer transition-all duration-200 transform hover:scale-[1.01] border-red-500 bg-red-50 shadow-lg ${
                          selectedCandidate === 0 ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => handleCandidateSelect(0)}
                      >
                        <div className="flex items-center space-x-3">
                          {/* NOTA numbering: last + 1 */}
                          <span className="font-bold text-blue-600">
                            {nominations.filter(
                              (n) => n.position === activePosition
                            ).length + 1}
                            .
                          </span>
                          <span className="font-semibold text-gray-800">
                            NOTA
                          </span>
                          <span className="text-xs text-red-600">
                            None of the Above
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Panel */}
              {!showCompletion && (
                <div className="bg-gray-800 p-3">
                  <div className="flex justify-between space-x-3">
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      disabled={isVoting}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 font-mono text-sm"
                    >
                      CLEAR
                    </button>
                    <button
                      onClick={handleVote}
                      disabled={selectedCandidate === null || isVoting}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 font-mono text-sm"
                    >
                      {isVoting ? "RECORDING..." : "CONFIRM"}
                    </button>
                  </div>
                </div>
              )}

              {/* EVM Footer */}
              <div className="bg-gray-900 px-3 py-1.5 text-white text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span>{signature}</span>
                  <span className="text-green-400">{gps}</span>
                  <span>IP: {ip}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-full lg:w-72 space-y-3">
            {/* Position Selector Panel */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5">
                <h3 className="font-bold text-center text-sm">
                  POSITION SELECTION
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {Array.isArray(announcements) && announcements.length > 0 ? (
                  [
                    ...new Set(
                      announcements
                        .map((item) => item.announcement?.title)
                        .filter(Boolean)
                    ),
                  ].map((position) => (
                    <button
                      key={position}
                      onClick={() => {
                        if (!isPositionDisabled(position)) {
                          setActivePosition(position);
                          setSelectedCandidate(null);
                        }
                      }}
                      className={`
      w-full py-2 px-3 rounded-lg font-semibold transition-all duration-200 text-xs
      ${
        votedPositions[position]
          ? "bg-green-600 text-white shadow-lg"
          : activePosition === position
          ? "bg-blue-600 text-white shadow-lg"
          : isPositionDisabled(position)
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-gray-100 text-gray-700 hover:bg-blue-100"
      }
      ${
        activePosition === position && votedPositions[position]
          ? "ring-2 ring-green-500"
          : activePosition === position
          ? "ring-2 ring-blue-500"
          : ""
      }
    `}
                      disabled={isPositionDisabled(position)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{getPositionDisplayName(position)}</span>
                        {votedPositions[position] && (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No positions available.
                  </p>
                )}
              </div>
            </div>

            {/* Progress Panel */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-2.5">
                <h3 className="font-bold text-center text-sm">
                  VOTING PROGRESS
                </h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Completed</span>
                    <span>
                      {getVotedCount()}/
                      {
                        [
                          ...new Set(
                            announcements
                              .map((item) => item.announcement?.title)
                              .filter(Boolean)
                          ),
                        ].length
                      }{" "}
                      positions
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (getVotedCount() /
                            [
                              ...new Set(
                                announcements
                                  .map((item) => item.announcement?.title)
                                  .filter(Boolean)
                              ),
                            ].length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  {[
                    ...new Set(
                      announcements
                        .map((item) => item.announcement?.title)
                        .filter(Boolean)
                    ),
                  ].map((position, idx) => (
                    <div
                      key={position}
                      className="flex items-center justify-between"
                    >
                      <span className="text-blue-600 font-bold mr-2">
                        {idx + 1}.
                      </span>
                      <span className="text-gray-600">
                        {getPositionDisplayName(position)}
                      </span>
                      <span
                        className={
                          votedPositions[position]
                            ? "text-green-500"
                            : "text-gray-400"
                        }
                      >
                        {votedPositions[position] ? "✓ Voted" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-center text-xs text-orange-800">
                <div className="font-semibold mb-2">INSTRUCTIONS</div>
                <div className="space-y-1 text-left">
                  <div>1. Select your preferred candidate</div>
                  <div>2. Press CONFIRM to cast vote</div>
                  <div>3. Continue to next position</div>
                  <div>4. Complete all positions to finish</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Details Modal */}
        {showCandidateDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-sm w-full p-4">
              {(() => {
                const candidate = nominations.find(
                  (n) => n._id === showCandidateDetails
                );
                if (!candidate) return null;
                return (
                  <>
                    <div className="text-center mb-3">
                      {candidate.image && (
                        <img
                          src={candidate.image}
                          alt={candidate.user?.name}
                          className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                        />
                      )}
                      <h3 className="text-lg font-bold">
                        {candidate.user?.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {candidate.designation}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Party:</strong> {candidate.party}
                      </div>
                      <div>
                        <strong>Experience:</strong> {candidate.experience}
                      </div>
                      <div>
                        <strong>Symbol:</strong> {candidate.symbol}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCandidateDetails(null)}
                      className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Votes Display Modal */}
        {showVotes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border rounded p-4 max-w-xs w-full">
              <h4 className="font-bold mb-2">Votes for Candidate</h4>
              {(() => {
                const candidate = nominations.find((n) => n._id === showVotes);
                if (
                  !candidate ||
                  !candidate.votes ||
                  candidate.votes.length === 0
                ) {
                  return (
                    <div className="text-xs text-gray-500">No votes found.</div>
                  );
                }
                return candidate.votes.map((v, idx) => (
                  <div key={idx} className="text-xs mb-1">
                    <span>IP: {v.ip}</span> |{" "}
                    <span>Signature: {v.signature}</span>
                  </div>
                ));
              })()}
              <button
                className="mt-2 px-2 py-1 bg-gray-200 rounded w-full"
                onClick={() => setShowVotes(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedCorporateEVM;
