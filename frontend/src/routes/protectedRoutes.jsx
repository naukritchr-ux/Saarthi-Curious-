import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRoles }) => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  const userRole = localStorage.getItem("role_id");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(parseInt(userRole))) {
    // Redirect to appropriate dashboard based on role
    const roleDashboardMap = {
      1: "/admin",
      2: "/admin",
      3: "/team-leader",
      4: "/franchiseePartner",
      5: "/learner",
      6: "/franchiseePartner",
      7: "/head-office",
    };
    
    const redirectPath = roleDashboardMap[parseInt(userRole)] || "/";
    console.log("ProtectedRoute: Redirecting user with role", userRole, "to", redirectPath, "Required roles:", requiredRoles);
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

export default ProtectedRoute;