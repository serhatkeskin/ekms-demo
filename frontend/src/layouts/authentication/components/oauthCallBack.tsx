import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';
import CircularProgress from "@mui/material/CircularProgress";

// Updated import (NO individual login/setAuthError import)
import { useAuth } from "contexts/auth/AuthContext";
import { API_BASE } from "services/base";

function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, authActions] = useAuth(); // Use auth actions

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(`${API_BASE}/users/oauth/google/callback/`, {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        // const data = await response.json();

        // Use new context login action
        // authActions.login({
        //   access: data.access,
        //   username: data.username || 'user',
        //   is_staff: data.is_staff,
        //   is_superuser: data.is_superuser
        // });

        const redirectTo = localStorage.getItem("post_login_redirect") || "/dashboard/project";
        localStorage.removeItem("post_login_redirect");
        navigate(redirectTo, { replace: true });
      } catch (error) {
        setError(`Failed to complete authentication: ${error.message}`);
        authActions.setAuthError(`OAuth authentication failed: ${error.message}`);
        setLoading(false);
      }
    };

    fetchTokens();
  }, [navigate, authActions]);

  return (
    <MDBox display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" p={3}>
      {error ? (
        <>
          <MDTypography variant="h4" color="error" mb={2}>{error}</MDTypography>
          <MDButton variant="gradient" color="primary" onClick={() => navigate("/authentication/sign-in")}>
            Return to Login
          </MDButton>
        </>
      ) : (
        <>
          <CircularProgress color="warning" />
          <MDTypography variant="h4" mt={2} mb={2}>Completing authentication...</MDTypography>
          <MDTypography variant="body2" color="text" sx={{ maxWidth: "400px", textAlign: "center" }}>
            If you are not redirected automatically, your session might not be properly established.
          </MDTypography>
        </>
      )}
    </MDBox>
  );
}

export default OAuthCallback;
