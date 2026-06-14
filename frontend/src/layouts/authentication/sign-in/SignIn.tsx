import { useState, useEffect } from "react";

// react-router-dom components
import { Link, useNavigate, useLocation } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import ErrorIcon from "@mui/icons-material/Error";
import PersonOffIcon from "@mui/icons-material/PersonOff";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDInput from 'components/MDInput/MDInput';
import MDButton from 'components/MDButton/MDButton';
import MDAlert from 'components/MDAlert/MDAlert';
import MDSnackbar from "components/MDSnackbar/MDSnackbar";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Images
import bgImage from "assets/images/bg-sign-in-basic.jpeg";

// Auth context
import { useAuth } from "contexts/auth/AuthContext";
import { API_BASE } from "services/base";

function SignIn() {
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    color: "error",
    icon: "error",
    title: "Error",
    content: "",
    dateTime: "",
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, authActions] = useAuth();
  const { isAuthenticated, error, loading } = auth;

  // Handle URL query parameters on page load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorParam = queryParams.get('error');
    
    if (errorParam === 'inactive_user') {
      setNotification({
        open: true,
        color: "warning",
        icon: "person_off",
        title: "Account Pending Approval",
        content: "Your account is currently inactive. Please wait for administrator approval before signing in.",
        dateTime: new Date().toLocaleTimeString(),
      });
      
      // Clear the error parameter from URL without page refresh
      navigate('/authentication/sign-in', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      // Önceden geldiği sayfa varsa oraya git
      const redirectTo = location.state?.from || "/dashboard/project";
      console.log("Redirecting to:", redirectTo);
      navigate(redirectTo, { replace: true });
    }

    if (error) {
      authActions.clearError();
    }
  }, [isAuthenticated, navigate, error, authActions, location.state]);


  // Show error notification when error state changes
  useEffect(() => {
    if (error) {
      setNotification({
        open: true,
        color: "error",
        icon: "error",
        title: "Authentication Error",
        content: error,
        dateTime: new Date().toLocaleTimeString(),
      });
    }
  }, [error]);

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    authActions.clearError();

    await authActions.login({
      username,
      password,
      remember_me: rememberMe,
    });
  };

  const handleGoogleLogin = () => {
    const redirectTo = location.state?.from || window.location.pathname || "/dashboard/project";
    localStorage.setItem("post_login_redirect", redirectTo);
    window.location.href = `${API_BASE}/accounts/google/login/`;
  };
  
  return (
    <BasicLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="warning"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Sign in
          </MDTypography>
          <Grid container spacing={3} justifyContent="center" sx={{ mt: 1, mb: 2 }}>
            <Grid item xs={2}>
              <MDTypography 
                component="a" 
                onClick={handleGoogleLogin}
                variant="body1" 
                color="white"
                sx={{ cursor: "pointer" }}
              >
                <GoogleIcon color="inherit" />
              </MDTypography>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleLogin}>
            <MDBox mb={2}>
              <MDInput 
                type="text" 
                label="Username" 
                fullWidth 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput 
                type="password" 
                label="Password" 
                fullWidth 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} disabled={loading} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Remember me
              </MDTypography>
            </MDBox>
            <MDBox mt={4} mb={1}>
              <MDButton 
                variant="gradient" 
                color="warning" 
                fullWidth 
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </MDButton>
            </MDBox>
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                Don&apos;t have an account?{" "}
                <MDTypography
                  component={Link}
                  to="/authentication/sign-up"
                  variant="button"
                  color="warning"
                  fontWeight="medium"
                  textGradient
                >
                  Sign up
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
      
      {/* Error notification snackbar */}
      <MDSnackbar
        color={notification.color}
        icon={notification.icon}
        title={notification.title}
        content={notification.content}
        dateTime={notification.dateTime}
        open={notification.open}
        onClose={closeNotification}
        close={closeNotification}
        bgWhite
      />
    </BasicLayout>
  );
}

export default SignIn;