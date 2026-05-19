import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ roles, children }) => {
  const { user, peran } = useAuth();

  // belum login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // role tidak sesuai
  if (roles && !roles.includes(peran)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;