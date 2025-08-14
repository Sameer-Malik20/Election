import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  name: string;
  email: string;
}

interface Nomination {
  _id: string;
  user?: User;
  position: string;
  description: string;
  createdAt: string;
  isVerified: boolean;
  isRejected: boolean;
  rejectReason?: string;
  err: string;
}

const AllNominations: React.FC = () => {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [currentNominationId, setCurrentNominationId] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    fetchNominations();
  }, []);

  const fetchNominations = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const adminId = String(userData._id); // current admin ID

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

      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        // Filter verified nominations
        const filterNominations = data.filter((n: any) => {
          const isMatch = n.user && String(n.user.uploadedBy) === adminId;
          return isMatch;
        });

        setNominations(filterNominations); // set only the filtered nominations
        setMessage("Nominations loaded successfully!");
      } else {
        setError(data.message || "Failed to fetch nominations");
      }
    } catch (err: any) {
      console.error("Error fetching nominations:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `http://localhost:5000/api/nomination/verify/${id}`,
        {
          method: "PUT",
          headers: {
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
      if (res.ok) {
        alert("Nomination verified successfully!");
        fetchNominations();
      } else alert(data.message);
    } catch (err) {
      alert("Error verifying nomination");
    }
  };

  const openRejectModal = (id: string) => {
    setCurrentNominationId(id);
    setRejectReason("");
    setShowModal(true);
  };

  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason before submitting.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `http://localhost:5000/api/nomination/reject/${currentNominationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        alert("Nomination rejected successfully!");
        setShowModal(false);
        fetchNominations();
      } else alert(data.message);
    } catch (err) {
      alert("Error rejecting nomination");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this nomination?"))
      return;

    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`http://localhost:5000/api/nomination/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        alert("Nomination deleted successfully!");
        fetchNominations();
      } else alert(data.message);
    } catch (err) {
      alert("Error deleting nomination");
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-xl font-semibold">
        Loading nominations...
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
        📋 All Nominations (Admin)
      </h2>
      {message && (
        <div className="mb-4 text-center text-green-600">{message}</div>
      )}

      <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {nominations.length > 0 ? (
              nominations.map((nom) => (
                <tr key={nom._id}>
                  <td className="px-6 py-4 text-sm">
                    {nom.user?.name || "Unknown User"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {nom.user?.email || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {nom.position}
                  </td>
                  <td
                    className="px-6 py-4 text-sm truncate max-w-xs"
                    title={nom.description}
                  >
                    {nom.description || "No bio provided"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(nom.createdAt).toLocaleString()}
                  </td>

                  {/* Status Column */}
                  <td className="px-6 py-4 text-sm">
                    {nom.isVerified ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        Verified
                      </span>
                    ) : nom.isRejected ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        Pending
                      </span>
                    )}
                    {nom.isRejected && nom.rejectReason && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reason: {nom.rejectReason}
                      </p>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-sm flex space-x-2">
                    {!nom.isVerified && !nom.isRejected && (
                      <>
                        <button
                          onClick={() => handleVerify(nom._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => openRejectModal(nom._id)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                        >
                          Reject
                        </button>
                        {showModal && (
                          <div className="fixed inset-0 flex items-center justify-center backdrop-blur ">
                            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                              <h2 className="text-lg font-semibold mb-3">
                                🚫 Reject Nomination
                              </h2>
                              <textarea
                                className="w-full border p-2 rounded mb-3"
                                rows={3}
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) =>
                                  setRejectReason(e.target.value)
                                }
                              ></textarea>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setShowModal(false)}
                                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={submitRejection}
                                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                >
                                  Submit
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(nom._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No nominations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllNominations;
