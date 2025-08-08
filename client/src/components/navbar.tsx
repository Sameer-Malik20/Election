import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-600 px-4 py-3 flex items-center justify-between shadow-md">
      <div className="text-white font-semibold text-xl">
        <Link to="/">Voting App</Link>
      </div>

      <div>
        <Link
          to="/login"
          className="bg-white text-blue-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition"
        >
          Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
