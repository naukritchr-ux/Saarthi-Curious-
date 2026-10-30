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
import CertificateManagement from "./pages/admin/certificates";

import TeamLeaderDashboard from "./pages/teamLeader/teamLeaderDashboard";
import FranchiseeDashboard from "./pages/franchiseePartner/franchiseeDashboard";
import EmployeeDashboard from "./pages/employee/employeeDashboard";
import HeadOfficeDashboard from "./pages/headOffice/headOfficeDashboard";
import StreakManagement from "./pages/gamification/streakManagement";
import AdminStreakManagement from "./pages/gamification/adminStreakManagement";
import Leaderboard from "./pages/gamification/leaderboard";
import CuroManagement from "./pages/gamification/curoManagement";
import ProtectedRoute from "./routes/protectedRoutes";
import RoleRoute from "./routes/roleRoute";
import NotificationScriptsPage from "./pages/communication/notificationScriptsPage";
import Rewards from "./pages/gamification/Rewards";
import Profile from "./pages/profile/profile";
import Settings from "./pages/settings/settings";
import PrivacyPolicy from "./pages/privacyPolicy/privacyPolicy";
import LearnerDashboard from "./pages/learner/learnerDashboard";
import ReportsAnalytics from "./pages/Reports/ReportsAnalytics";
import OpenProgram from "./pages/learner/openProgram/openProgram";
import CertificatePage from "./pages/learner/openProgram/certificatePage";
import RetentionQuizPage from "./pages/learner/RetentionQuizPage";
import RetentionQuizResultPage from "./pages/learner/RetentionQuizResultPage";
import ApplicationCheckPage from "./pages/learner/ApplicationCheckPage";
import ApplicationCheckResult from "./pages/learner/openProgram/applicationCheckResult";
import AllAssignmentsPage from "./pages/learner/AllAssignmentsPage";
import BookCall from "./pages/bookcall/BookCall";
import AdminReschedule from "./pages/AdminReschedule";
import BookCallPage from "./pages/booking/BookCallPage";
import BookMeetingPage from "./pages/booking/BookMeetingPage";
import SaarthiDashboard from "./pages/booking/SaarthiDashboard";
import IndividualLearnerReport from "./pages/Reports/IndividualLearnerReport";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={[1, 2]}>
              <MasterAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-admin"
          element={
            <ProtectedRoute requiredRoles={[1]}>
              <MasterAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/team-leader"
          element={
            <ProtectedRoute requiredRoles={[3, 6]}>
              <TeamLeaderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/team"
          element={
            <ProtectedRoute requiredRoles={[3, 6]}>
              <TeamLeaderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/franchiseePartner"
          element={
            <ProtectedRoute requiredRoles={[4, 6]}>
              <FranchiseeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/head-office"
          element={
            <ProtectedRoute requiredRoles={[7]}>
              <HeadOfficeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee"
          element={
            <ProtectedRoute requiredRoles={[5]}>
              <Navigate to="/learner" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <LearnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/certificates"
          element={
            <ProtectedRoute>
              <CertificatePage />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/application-check/:checkId"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <ApplicationCheckPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/application-check/:checkId/result"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <ApplicationCheckResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/all-assignments"
          element={
            <ProtectedRoute requiredRoles={[3, 4, 5, 6, 7]}>
              <AllAssignmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/programs/edit/:id" element={<EditPrograms />} />

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
          path="/learner/certificate/:certificateId"
          element={
            <ProtectedRoute>
              <CertificatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/program/:programId"
          element={
            <ProtectedRoute>
              <OpenProgram />
            </ProtectedRoute>
          }
        />

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
          path="/admin/streak-management"
          element={
            <ProtectedRoute requiredRoles={[1, 2]}>
              <AdminStreakManagement />
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
              <Rewards />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidate-attrition"
          element={
            <ProtectedRoute>
              <CandidateAttrition />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/:userId/report"
          element={
            <ProtectedRoute requiredRoles={[1, 2, 3, 4, 6]}>
              <IndividualLearnerReport />
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

        <Route
          path="/team-directory"
          element={
            <ProtectedRoute requiredRoles={[3, 6]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/franchise-directory"
          element={
            <ProtectedRoute requiredRoles={[4]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/admin/certificates"
          element={
            <ProtectedRoute requiredRoles={[1, 2]}>
              <CertificateManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communication/notification-scripts"
          element={
            <ProtectedRoute>
              <NotificationScriptsPage />
            </ProtectedRoute>
          }
        />

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
              <BookCallPage mode="learner" hostId={57} hostName="L&D Lead" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/schedule"
          element={
            <ProtectedRoute requiredRoles={[1, 2]}>
              <BookCallPage mode="admin" hostId={57} />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/reschedule" element={<Navigate to="/admin/schedule" replace />} />
        <Route path="/calendar" element={<ProtectedRoute><SaarthiDashboard adminId={57} /></ProtectedRoute>} />
        <Route path="/saarthi-dashboard" element={<ProtectedRoute><SaarthiDashboard adminId={57} /></ProtectedRoute>} />
        <Route path="/book/:hostId" element={<BookMeetingPage />} />
        <Route path="/book" element={<BookMeetingPage hostId={2} />} />

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
                  6: "/team-leader",
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