import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
interface Admin {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface StatsCard {
  title: string;
  value: string | number;
  icon: JSX.Element;
  change: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [totalAdmin, setTotalAdmin] = useState<number>(0);
  const [adminUsers, SetadminUsers] = useState([]);
  const [totalusers, settotalusers] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [employeeUsers, setEmployeeUsers] = useState([]);
  const navigate = useNavigate();
  // Filter admins by search

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch("http://localhost:5000/api/auth/count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const adminUsers =
          data.users?.filter((user) => user.role === "admin") || [];
        setTotalAdmin(adminUsers.length);
        SetadminUsers(adminUsers);

        const filteredAdmins = admins.filter(
          (admin) =>
            admin.name.toLowerCase().includes(search.toLowerCase()) ||
            admin.email.toLowerCase().includes(search.toLowerCase()) ||
            admin.phone.includes(search)
        );
      })
      .catch((err) => {
        console.error("Fetch error:", err.message);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch("http://localhost:5000/api/auth/count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const employees =
          data.users?.filter((user) => user.role === "employee") || [];

        setTotalUsersCount(employees.length); // सिर्फ count
        setEmployeeUsers(employees); // पूरी list
      })
      .catch((err) => {
        console.error("Fetch error:", err.message);
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const mockStats: StatsCard[] = [
          {
            title: "Total Admins",
            value: totalAdmin,
            icon: (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ),
            change: 12,
          },
          {
            title: "Total Users",
            value: totalUsersCount,
            icon: (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
            change: 8,
          },
        ];

        await new Promise((resolve) => setTimeout(resolve, 800));
        setStats(mockStats);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [totalAdmin, totalUsersCount]);

  const filteredAdmins = adminUsers.filter(
    (admin) =>
      admin.name?.toLowerCase().includes(search.toLowerCase()) ||
      admin.email?.toLowerCase().includes(search.toLowerCase()) ||
      admin.phone?.includes(search)
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Dashboard Overview */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${
                  index % 4 === 0
                    ? "bg-indigo-100 text-indigo-600"
                    : index % 4 === 1
                    ? "bg-green-100 text-green-600"
                    : index % 4 === 2
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Search Bar */}
      <div className="mb-4 mt-8">
        <input
          type="text"
          placeholder="Search admin by name, email, or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Admin List */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">Admin List</h3>
        {filteredAdmins.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">Email</th>
                <th className="border border-gray-300 p-2">Phone</th>
                <th className="border border-gray-300 p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr
                  key={admin._id}
                  onClick={() => navigate(`/super/admindash/${admin._id}`)}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <td className="border border-gray-300 p-2">{admin.name}</td>
                  <td className="border border-gray-300 p-2">{admin.email}</td>
                  <td className="border border-gray-300 p-2">{admin.phone}</td>
                  <td className="border border-gray-300 p-2">
                    <Link
                      to={`/superadmin/admin-details/${admin._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No admins found</p>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
