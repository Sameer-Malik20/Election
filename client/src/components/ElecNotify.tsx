import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Announcement {
  _id: string;
  description: string;
  eligibility: string;
  createdAt: string;
}

export default function PublishAnnouncement() {
  const positions: string[] = [
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
  // eligibility rules
  const eligibilityRules: Record<string, string> = {
    CEO: "Minimum 15 years of experience, MBA or equivalent, leadership skills required",
    CTO: "Minimum 12 years of experience, B.Tech/M.Tech in CS or related field, strong technical leadership",
    CFO: "Minimum 12 years of experience, MBA (Finance) or CA, expertise in financial planning",
    COO: "Minimum 10 years of experience, MBA or equivalent, strong operations management",
    Manager:
      "Minimum 5 years of experience, Bachelor's degree, team management skills",
    "Team Lead":
      "Minimum 4 years of experience, Bachelor's in CS/IT, leadership and project management",
    "Senior Developer":
      "Minimum 5 years of experience, Bachelor's in CS/IT, system design and mentorship",
    Developer:
      "Minimum 1 year of experience, Bachelor's in CS/IT, strong programming skills",
    "HR Manager":
      "Minimum 6 years of experience, MBA (HR), recruitment and employee relations",
    "Marketing Head":
      "Minimum 8 years of experience, MBA (Marketing), expertise in brand management",
    "Sales Manager":
      "Minimum 6 years of experience, MBA (Sales/Marketing), negotiation and sales strategy",
    "Product Manager":
      "Minimum 5 years of experience, Bachelor's in Business/Tech, agile & product strategy",
    "Operations Manager":
      "Minimum 6 years of experience, Bachelor's/MBA, logistics & resource management",
    "Finance Manager":
      "Minimum 6 years of experience, MBA (Finance) or CA, budgeting and compliance",
  };

  const [title, setTitle] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [responseMsg, setResponseMsg] = useState<string>("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [eligibility, setEligibility] = useState<string>("");
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = String(userData._id);

      const res = await fetch(
        "https://election-4j7k.onrender.com/api/nomination/getall?type=announcements",
        {
          headers: { Authorization: `Bearer ${token}` },
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
        // Filter announcements created by current admin
        const filteredAnnouncements = data.filter(
          (announcement: any) =>
            String(announcement.user?._id) === currentUserId &&
            announcement.isElectionCompleted == false
        );

        setAnnouncements(filteredAnnouncements);
      } else {
        setResponseMsg(` ${data.message}`);
      }
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
          body: JSON.stringify({ title, message: messageText, eligibility }),
        }
      );
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
        return;
      }
      const data = await res.json();

      if (res.ok) {
        setResponseMsg(`${data.message || "Announcement published!"}`);
        setTitle("");
        setMessageText("");
        setEligibility("");
        fetchAnnouncements(); // refresh list
      } else setResponseMsg(` ${data.message}`);
    } catch (err) {
      setResponseMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Delete Announcement
  const handleDelete = async (id: string) => {
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
        return;
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
      {/* Dropdown */}
      <select
        value={title}
        onChange={(e) => {
          const pos = e.target.value;
          setTitle(pos);
          setEligibility(eligibilityRules[pos] || ""); // auto set eligibility
        }}
        className="border p-2 rounded w-full mb-3"
      >
        <option value="">-- Select Position --</option>
        {positions.map((pos, i) => (
          <option key={i} value={pos}>
            {pos}
          </option>
        ))}
      </select>
      {eligibility && (
        <div>
          <strong>Eligibility: {eligibility}</strong>
        </div>
      )}

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
