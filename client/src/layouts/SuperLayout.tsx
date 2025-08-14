import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { isAuthenticated, getUser, clearAuthTokens } from "../utlis/auth";
import Sidebar from "../components/Sidebar";

export default function SuperLayout() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "super") {
      navigate("/login");
    }
  }, [navigate, user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearAuthTokens();
      navigate("/login");
    }
  };

  if (!isAuthenticated() || user?.role !== "super") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* @ts-ignore */}
      <Sidebar role="admin" onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-800">
              Super Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
