import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/login";
import MasterAdminDashboard from "./pages/masterAdmin/masterAdminDashboard";
import ProgramsPage from "./pages/programs/programsPage";
import CreatePrograms from "./pages/programs/createPrograms";
import EditPrograms from "./pages/programs/editPrograms";
import ProgramDetails from "./pages/programs/programDetails";
import ApplicationCheckSubmissions from "./pages/programs/ApplicationCheckSubmissions.jsx";
import CandidateAttrition from "./pages/admin/candidateAttrition";
import UserManagementPage from "./pages/admin/userManagement";
import RoleManagementPage from "./pages/admin/roleManagement";
import InactiveUsersPage from "./pages/admin/inactiveUsers";

import TeamLeaderDashboard from "./pages/teamLeader/teamLeaderDashboard";
import FranchiseeDashboard from "./pages/franchiseePartner/franchiseeDashboard";
import EmployeeDashboard from "./pages/employee/employeeDashboard";
import HeadOfficeDashboard from "./pages/headOffice/headOfficeDashboard";
import StreakManagement from "./pages/gamification/streakManagement";
import Leaderboard from "./pages/gamification/leaderboard";
import CuroManagement from "./pages/gamification/curoManagement";
import ProtectedRoute from "./routes/protectedRoutes";
import RoleRoute from "./routes/roleRoute";
import NotificationScriptsPage from "./pages/communication/notificationScriptsPage";
import BadgeManagement from "./pages/gamification/badgeManagement";
import Profile from "./pages/profile/profile";
import Settings from "./pages/settings/settings";
import PrivacyPolicy from "./pages/privacyPolicy/privacyPolicy";
import LearnerDashboard from "./pages/learner/learnerDashboard";
import ReportsPage from "./pages/Reports/ReportsPage";
import OpenProgram from "./pages/learner/openProgram/openProgram";
import RetentionQuizPage from "./pages/learner/RetentionQuizPage";
import RetentionQuizResultPage from "./pages/learner/RetentionQuizResultPage";
import ApplicationCheckPage from "./pages/learner/ApplicationCheckPage";
import ApplicationCheckResult from "./pages/learner/openProgram/applicationCheckResult";
import AllAssignmentsPage from "./pages/learner/AllAssignmentsPage";
import BookCall from "./pages/bookcall/BookCall";
import AdminReschedule from "./pages/AdminReschedule";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Master Admin & Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={[1, 2]}>
              <MasterAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Master Admin redirect to /admin */}
        <Route
          path="/master-admin"
          element={
            <ProtectedRoute requiredRoles={[1]}>
              <MasterAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Team Leader Dashboard */}
        <Route
          path="/team-leader"
          element={
            <ProtectedRoute requiredRoles={[3, 6]}>
              <TeamLeaderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Team (Redirect to team-leader or keep for compatibility) */}
        <Route
          path="/team"
          element={
            <ProtectedRoute requiredRoles={[3, 6]}>
              <TeamLeaderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Franchisee Partner Dashboard */}
        <Route
          path="/franchiseePartner"
          element={
            <ProtectedRoute requiredRoles={[4, 6]}>
              <FranchiseeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Head Office Dashboard */}
        <Route
          path="/head-office"
          element={
            <ProtectedRoute requiredRoles={[7]}>
              <HeadOfficeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Employee Dashboard - Redirect to learner dashboard */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute requiredRoles={[5]}>
              <Navigate to="/learner" replace />
            </ProtectedRoute>
          }
        />

        {/* Learner Dashboard */}
        <Route
          path="/learner"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <LearnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Retention Quiz */}
        <Route
          path="/retention-quiz/:quizId"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <RetentionQuizPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/retention-quiz/:quizId/result"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <RetentionQuizResultPage />
            </ProtectedRoute>
          }
        />

        {/* Application Check */}
        <Route
          path="/application-check/:checkId"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <ApplicationCheckPage />
            </ProtectedRoute>
          }
        />

        {/* Application Check Result */}
        <Route
          path="/learner/application-check/:checkId/result"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <ApplicationCheckResult />
            </ProtectedRoute>
          }
        />

        {/* All Assignments */}
        <Route
          path="/all-assignments"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <AllAssignmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Programs - Accessible by multiple roles */}
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/programs/edit/:id" element={<EditPrograms />} />

        {/* Admin Application Check Submissions */}
        <Route
          path="/application-check-submissions"
          element={
            <ProtectedRoute requiredRoles={[1, 2]}>
              <ApplicationCheckSubmissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/programs/create"
          element={
            <ProtectedRoute>
              <CreatePrograms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/programs/:id"
          element={
            <ProtectedRoute>
              <ProgramDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/programs/edit/:id"
          element={
            <ProtectedRoute>
              <EditPrograms />
            </ProtectedRoute>
          }
        />

        {/* Program/Module View for Learners */}
        <Route
          path="/program/:programId"
          element={
            <ProtectedRoute>
              <OpenProgram />
            </ProtectedRoute>
          }
        />

        {/* Gamification Features */}
        <Route
          path="/leaderboards"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/streak-management"
          element={
            <ProtectedRoute>
              <StreakManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/curo-management"
          element={
            <ProtectedRoute>
              <CuroManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <BadgeManagement />
            </ProtectedRoute>
          }
        />

        {/* Admin Management */}
        <Route
          path="/candidate-attrition"
          element={
            <ProtectedRoute>
              <CandidateAttrition />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRoles={[1, 2, 3, 4, 6]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Team Directory - for Team Leaders and Franchise Developers */}
        <Route
          path="/team-directory"
          element={
            <ProtectedRoute requiredRoles={[3, 6]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Franchise Directory - for Franchise Partners */}
        <Route
          path="/franchise-directory"
          element={
            <ProtectedRoute requiredRoles={[4]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/reschedule" element={<AdminReschedule />} />

        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <RoleManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/inactive-users"
          element={
            <ProtectedRoute>
              <InactiveUsersPage />
            </ProtectedRoute>
          }
        />

        {/* Communication */}
        <Route
          path="/communication/notification-scripts"
          element={
            <ProtectedRoute>
              <NotificationScriptsPage />
            </ProtectedRoute>
          }
        />

        {/* User Profile & Settings */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        <Route
          path="/book-call"
          element={
            <ProtectedRoute>
              <BookCall />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect based on role */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              {(() => {
                const role = parseInt(localStorage.getItem("role_id"));
                const dashboardMap = {
                  1: "/admin",
                  2: "/admin",
                  3: "/team-leader",
                  4: "/franchiseePartner",
                  5: "/learner",
                  6: "/franchiseePartner",
                  7: "/head-office",
                };
                return <Navigate to={dashboardMap[role] || "/"} replace />;
              })()}
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
