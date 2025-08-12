// UserInfoSections.tsx
import { useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
}

export default function UserInfoSections() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading] = useState(false);
  const [, setError] = useState("");

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
        setUsers(data.users || []);
      })
      .catch((err) => {
        console.error("Fetch error:", err.message);
        setError(err.message);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All Users</h1>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">#</th>{" "}
            {/* ✅ Count index column */}
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Phone</th>
            <th className="border px-4 py-2">Address</th>
            <th className="border px-4 py-2">Role</th>
          </tr>
        </thead>

        <tbody>
          {users.length > 0 ? (
            users.map((u, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{i + 1}</td> {/* ✅ Index */}
                <td className="border px-4 py-2">{u.name || "N/A"}</td>
                <td className="border px-4 py-2">{u.email || "N/A"}</td>
                <td className="border px-4 py-2">{u.phone || "N/A"}</td>
                <td className="border px-4 py-2">{u.address || "N/A"}</td>
                <td className="border px-4 py-2">{u.role || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4">
                No verified users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
