import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ roles, children }) => {
  const auth = useAuth();

  if (!auth) return <Navigate to="/login" replace />;
  if (!roles.includes(auth.peran)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
