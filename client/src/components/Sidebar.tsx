import { NavLink } from "react-router-dom";

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  // localStorage से role ले लो
  const role = localStorage.getItem("role") as
    | "admin"
    | "super"
    | "employee"
    | null;

  if (!role) return null; // role अभी available नहीं है

  const adminLinks = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users Nomination", path: "/admin/users" },
    { name: "Reports", path: "/admin/notify" },
    { name: "Upload Data", path: "/admin/data" },
    { name: "Settings", path: "/admin/settings" },
  ];

  const superLinks = [
    { name: "Dashboard", path: "/super" },
    { name: "Manage Admins", path: "/super/admins" },
    { name: "Create Admin", path: "/super/createadmin" },
    { name: "Settings", path: "/super/settings" },
  ];

  const employeeLinks = [
    { name: "Dashboard", path: "/employee" },
    { name: "Voting", path: "/" },
    { name: "Tasks", path: "/employee/tasks" },
    { name: "Profile", path: "/employee/profile" },
  ];

  const links =
    role === "admin"
      ? adminLinks
      : role === "super"
      ? superLinks
      : employeeLinks;

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-indigo-600">
              {role === "admin"
                ? "Admin Portal"
                : role === "super"
                ? "Super Admin Portal"
                : "Employee Portal"}
            </h1>
          </div>

          <nav className="mt-5 flex-1 px-2 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <button
            onClick={onLogout}
            className="flex-shrink-0 w-full group block"
          >
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-red-500 group-hover:text-red-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Sign out
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
