import React, { useState, useEffect } from "react";

export default function PublishAnnouncement() {
  const positions = [
    "CEO",
    "CTO",
    "CFO",
    "COO",
    "Manager",
    "Team Lead",
    "Senior Developer",
    "Developer",
    "HR Manager",
    "Marketing Head",
    "Sales Manager",
    "Product Manager",
    "Operations Manager",
    "Finance Manager",
  ];

  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [announcements, setAnnouncements] = useState([]);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(
        "https://election-4j7k.onrender.com/api/nomination/getall?type=announcements",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
      }
      const data = await res.json();
      if (res.ok) setAnnouncements(data);
      else setResponseMsg(` ${data.message}`);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  // Publish Announcement
  const handlePublish = async () => {
    if (!title || !messageText.trim()) {
      setResponseMsg("Please select a position and enter a message");
      return;
    }
    setLoading(true);
    setResponseMsg("");
    try {
      const res = await fetch(
        "https://election-4j7k.onrender.com/api/nomination/publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, message: messageText }),
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
      }
      const data = await res.json();
      if (res.ok) {
        setResponseMsg(`${data.message || "Announcement published!"}`);
        setTitle("");
        setMessageText("");
        fetchAnnouncements(); // refresh list
      } else setResponseMsg(` ${data.message}`);
    } catch (err) {
      setResponseMsg(" Server error");
    } finally {
      setLoading(false);
    }
  };

  //  Delete Announcement
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;

    try {
      const res = await fetch(
        `https://election-4j7k.onrender.com/api/nomination/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
      }
      const data = await res.json();
      if (res.ok) {
        setResponseMsg(` ${data.message}`);
        fetchAnnouncements();
      } else alert(` ${data.message}`);
    } catch (err) {
      alert("Server error while deleting");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        📢 Admin: Publish New Announcement
      </h2>

      {/* Dropdown */}
      <select
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded w-full mb-3"
      >
        <option value="">-- Select Position --</option>
        {positions.map((pos, i) => (
          <option key={i} value={pos}>
            {pos}
          </option>
        ))}
      </select>

      {/* Message */}
      <textarea
        className="w-full border rounded p-2 mb-3"
        rows={4}
        placeholder="Write announcement message..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
      ></textarea>

      {/* Publish Button */}
      <button
        onClick={handlePublish}
        disabled={loading}
        className={`w-full py-2 rounded text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Publishing..." : "Publish Announcement"}
      </button>

      {/* Response */}
      {responseMsg && (
        <p
          className={`mt-4 text-center font-medium ${
            responseMsg.includes("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {responseMsg}
        </p>
      )}

      {/* Announcement List */}
      <h3 className="text-lg font-bold mt-8 mb-3">
        📄 Published Announcements
      </h3>
      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((a) => (
            <div
              key={a._id}
              className="border p-4 rounded shadow-sm flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold">{a.description}</h4>

                <span className="text-sm text-gray-500">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleDelete(a._id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No announcements found.</p>
        )}
      </div>
    </div>
  );
}
