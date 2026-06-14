import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "contexts/auth/AuthContext";
// TODO will be moved to somewhere appropriate, this location doesn't fit
function ProtectedRoute({ children }) {
  const [auth] = useAuth();
  const { isAuthenticated, loading } = auth;

  if (loading) {
    // You could replace this with a loading spinner component
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log("You are not authenticated to see this ProtectedRoute!") // TODO DEBUGGING
    return <Navigate to="/authentication/sign-in" />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;