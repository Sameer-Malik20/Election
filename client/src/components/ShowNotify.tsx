import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Announcement {
  _id: string;
  announcement?: {
    title: string;
    message: string;
    eligibility: string;
  };
  createdAt: string;
}

interface Nomination {
  _id: string;
  position: string;
  createdAt: string;
  isVerified: boolean;
  isRejected: boolean;
  rejectReason?: string;
  isElectionCompleted?: boolean;
}

const PositionsList: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [resulation, setresulation] = useState<string>("");
  const [appliedAnnouncements, setAppliedAnnouncements] = useState<string[]>(
    []
  );
  const [myNomination, setMyNomination] = useState<Nomination[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedApplied: string[] = JSON.parse(
      localStorage.getItem("appliedPositions") || "[]"
    );
    setAppliedAnnouncements(storedApplied);

    fetchAnnouncements();
    fetchMyNomination();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        "https://election-4j7k.onrender.com/api/auth/published",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }

      const data = await res.json();
      console.log(data);

      if (res.ok) {
        const filtered = data.filter(
          (item: any) => item.isElectionCompleted === false
        );

        setAnnouncements(filtered);
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

  const fetchMyNomination = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        "https://election-4j7k.onrender.com/api/auth/myNom",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }
      const data = await res.json();
      console.log("mynom", data);

      if (res.ok && Array.isArray(data) && data.length > 0) {
        const sortedNominations = data
          .filter((n: Nomination) => n.isElectionCompleted === false)
          .sort(
            (a: Nomination, b: Nomination) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        console.log(sortedNominations);

        setMyNomination(sortedNominations);
      } else {
        setMyNomination([]);
      }
    } catch (err) {
      console.error("Error fetching nominations:", err);
    }
  };

  const handleApplyClick = (announcement: Announcement) => {
    if (appliedAnnouncements.includes(announcement._id)) return;
    setSelectedAnnouncement(announcement);
    setresulation("");
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  const handleSubmit = async () => {
    if (!selectedAnnouncement) return;
    if (resulation.trim() === "") {
      alert("Please write your resulation before submitting.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        "https://election-4j7k.onrender.com/api/nomination/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            position: selectedAnnouncement?.announcement?.title,
            description: resulation,
          }),
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }

      if (res.status === 201 || res.status === 409) {
        setMessage(
          res.status === 201
            ? "Application submitted successfully!"
            : "You have already applied for this position."
        );

        setAppliedAnnouncements((prev) => {
          if (!prev.includes(selectedAnnouncement._id)) {
            const updated = [...prev, selectedAnnouncement._id];
            localStorage.setItem("appliedPositions", JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setMessage("Server error while submitting application.");
    }

    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-xl font-semibold">
        Loading announcements...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10 text-red-600 text-xl font-semibold">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">
        📢 Available Announcements
      </h2>
      {Array.isArray(myNomination) && myNomination.length > 0 ? (
        <div className="mb-4 p-4 rounded border shadow bg-gray-50">
          <h3 className="font-bold mb-2">Your Applications</h3>

          {myNomination.map((n) => (
            <div key={n._id} className="mb-3 p-3 border-b">
              <p>
                <strong>Position:</strong> {n.position}
              </p>
              <p>
                <strong>Applied On:</strong>{" "}
                {new Date(n.createdAt).toLocaleString()}
              </p>

              {n.isVerified ? (
                <div className="mt-2 p-2 bg-green-100 text-green-700 rounded">
                  Verified by Admin!
                </div>
              ) : n.isRejected ? (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
                  ❌ Rejected
                  <p className="text-sm mt-1">
                    Reason: {n.rejectReason || "No reason provided"}
                  </p>
                </div>
              ) : (
                <div className="mt-2 p-2 bg-yellow-100 text-yellow-700 rounded">
                  ⏳ Pending Review
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {message && (
        <div className="mb-4 text-center text-green-600">{message}</div>
      )}

      <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eligibility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Apply
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <tr key={a._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {a.announcement?.title || "No Title"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {a.announcement?.message || "No Message"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {a.announcement?.eligibility || "No Message"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      className={`px-3 py-1 rounded cursor-pointer ${
                        appliedAnnouncements.includes(a._id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 text-white"
                      }`}
                      onClick={() => handleApplyClick(a)}
                      disabled={appliedAnnouncements.includes(a._id)}
                    >
                      {appliedAnnouncements.includes(a._id)
                        ? "Applied"
                        : "Apply"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No announcements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for application with resulation */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
            <h3 className="text-xl font-semibold mb-2">
              Apply for {selectedAnnouncement.announcement?.title}
            </h3>

            <p className="text-gray-600 mb-4 text-sm">
              📝 Please write a short resulation explaining why you are suitable
              for this position. This will help the admin review your
              application.
            </p>

            <label className="block mb-2 font-medium">Your resulation:</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              value={resulation}
              onChange={(e) => setresulation(e.target.value)}
              placeholder="Write about your experience, skills, and why you want this position..."
            />

            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleSubmit}
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionsList;
