import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (allowedRoles && !allowedRoles.includes(role)) {
        navigate("/lecturer");
      }
    }
  }, [isAuthenticated, role, loading, navigate, allowedRoles]);

  if (loading) return <p>Loading...</p>;
  return isAuthenticated ? children : null;
}

export default ProtectedRoute;
