import React, { useEffect, useState } from "react";

const PositionsList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [bio, setBio] = useState("");
  const [appliedAnnouncements, setAppliedAnnouncements] = useState([]);
  const [myNomination, setMyNomination] = useState(null);

  useEffect(() => {
    const storedApplied =
      JSON.parse(localStorage.getItem("appliedPositions")) || [];
    setAppliedAnnouncements(storedApplied);

    fetchAnnouncements();
    fetchMyNomination();
  }, []);

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
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
      }
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

  const fetchMyNomination = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:5000/api/auth/myNom", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
      }
      const data = await res.json();

      if (res.ok && Array.isArray(data) && data.length > 0) {
        // Sort by createdAt (latest first)
        const sortedNominations = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setMyNomination(sortedNominations);
      } else {
        setMyNomination([]);
      }
    } catch (err) {
      console.error("Error fetching nominations:", err);
    }
  };

  // When user clicks apply
  const handleApplyClick = (announcement) => {
    if (appliedAnnouncements.includes(announcement._id)) return;
    setSelectedAnnouncement(announcement);
    setBio("");
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  // Submit application
  const handleSubmit = async () => {
    if (!selectedAnnouncement) return;
    if (bio.trim() === "") {
      alert("Please write your bio before submitting.");
      return;
    }

    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch("http://localhost:5000/api/nomination/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          position: selectedAnnouncement?.announcement?.title,
          description: bio,
        }),
      });
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
      }
      const data = await res.json();

      if (res.status === 201 || res.status === 409) {
        setMessage(
          res.status === 201
            ? " Application submitted successfully!"
            : " You have already applied for this position."
        );

        setAppliedAnnouncements((prev) => {
          if (!prev.includes(selectedAnnouncement._id)) {
            const updated = [...prev, selectedAnnouncement._id];
            localStorage.setItem("appliedPositions", JSON.stringify(updated)); //  Persist
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setMessage(" Server error while submitting application.");
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

          {myNomination.map((n, index) => (
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
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No announcements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for application with bio */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
            <h3 className="text-xl font-semibold mb-2">
              Apply for {selectedAnnouncement.announcement?.title}
            </h3>

            <p className="text-gray-600 mb-4 text-sm">
              📝 Please write a short bio explaining why you are suitable for
              this position. This will help the admin review your application.
            </p>

            <label className="block mb-2 font-medium">Your Bio:</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
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
