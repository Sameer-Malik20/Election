import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import EVMUI from "./pages/EVMUI";
import UploadData from "./components/uploadData";
import PublishAnnouncement from "./components/ElecNotify";
import ShowPosition from "./components/ShowNotify";
import AllNominations from "./components/AllNomination";
import CandidateVotes from "./components/CandidateVotes";
import Navbar from "./components/navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* 👇 Only EVM route is active */}

        <Route path="/" element={<EVMUI />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="data" element={<UploadData />} />
          <Route path="notify" element={<PublishAnnouncement />} />
          <Route path="users" element={<AllNominations />} />
        </Route>

        <Route
          path="/employee/*"
          element={
            <ProtectedRoute role="employee">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeDashboard />} />
          <Route path="tasks" element={<ShowPosition />} />
          <Route
            path="candidate-votes/:candidateId"
            element={<CandidateVotes />}
          />
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
