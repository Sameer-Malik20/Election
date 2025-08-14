import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
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
import UserInfoSections from "./components/usersDetails";
import ResultPage from "./components/Result";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDash";
import SuperLayout from "./layouts/SuperLayout";
import AdminDetails from "./components/AdminDetails";
import Userdetailsbysuper from "./components/userdetailsbysuper";
import CandidateVotesbySuper from "./components/candidatevotebysuper";
import CreateAdmin from "./components/registerbysuper";

function ConditionalNavbar() {
  const location = useLocation();

  if (location.pathname === "/") {
    return <Navbar />;
  }
  return null;
}
function App() {
  return (
    <Router>
      <ConditionalNavbar />

      <Routes key={location.pathname} location={location}>
        {/* 👇 Only EVM route is active */}

        <Route path="/" element={<EVMUI />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Super Admin */}
        <Route
          path="/super/*"
          element={
            <ProtectedRoute role="super">
              <SuperLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="admindash/:adminId" element={<AdminDetails />} />
          <Route
            path="usersdetails/:adminId"
            element={<Userdetailsbysuper />}
          />
          <Route
            path="candidate-votes/:candidateId"
            element={<CandidateVotesbySuper />}
          />
          <Route path="createadmin" element={<CreateAdmin />} />
        </Route>

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
          <Route path="usersdetails" element={<UserInfoSections />} />
          <Route
            path="candidate-votes/:candidateId"
            element={<CandidateVotes />}
          />
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

          <Route path="result" element={<ResultPage />} />
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
