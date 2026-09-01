import { Navigate } from "react-router-dom";

const RoleRoute = ({ children, allowedRole, allowedRoles }) => {
  const roleId = Number(localStorage.getItem("role_id"));

  if (allowedRoles) {
    return allowedRoles.includes(roleId) ? (
      children
    ) : (
      <Navigate to="/" replace />
    );
  }

  if (allowedRole !== undefined) {
    return roleId === allowedRole ? children : <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
