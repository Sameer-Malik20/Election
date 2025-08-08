import React, { useState } from "react";

export default function UploadData() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [alreadyUsers, setAlreadyUsers] = useState<any[]>([]);
  const [failedUsers, setFailedUsers] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage(" Please select an Excel file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("");
      setAlreadyUsers([]);
      setFailedUsers([]);

      const token = localStorage.getItem("accessToken");

      const res = await fetch("http://localhost:5000/api/auth/upload-users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (res.status === 401) {
        alert("Token expired");
        navigate("/login");
      }
      const data = await res.json();

      if (res.ok) {
        setMessage(
          `Inserted: ${data.inserted} | ⚠️ Already: ${
            data.alreadyUsers?.length || 0
          } |  Failed: ${data.failedUsers?.length || 0} | Total: ${data.total}`
        );
        setAlreadyUsers(data.alreadyUsers || []);
        setFailedUsers(data.failedUsers || []);
      } else {
        setMessage(`Upload failed: ${data.message}`);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setMessage("Server error while uploading.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">📤 Upload Users Excel</h2>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="border p-2 rounded w-full mb-3"
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className={`w-full py-2 rounded text-white font-semibold ${
          uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && (
        <p className="mt-4 text-center font-medium text-gray-700">{message}</p>
      )}

      {/* Failed Users List */}
      {failedUsers.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-orange-600"> Failed Users:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {failedUsers.map((u, idx) => (
              <li key={idx}>
                {u.name} ({u.email}) → {u.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
