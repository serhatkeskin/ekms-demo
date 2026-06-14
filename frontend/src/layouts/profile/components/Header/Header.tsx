import { API_BASE } from "services/base";
import { useState, useEffect } from "react";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Icon from "@mui/material/Icon";
import Skeleton from "@mui/material/Skeleton";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDSnackbar from "components/MDSnackbar/MDSnackbar";

// EKMS React base styles
import breakpoints from "assets/theme/base/breakpoints";

// Custom components
import ProfileAvatar from "./ProfileAvatar";

// Images
import defaultAvatar from "assets/images/default_avatar.jpg";
import backgroundImage from "assets/images/bg-profile.jpeg";

// API
import userApi from "services/userApi";

function Header({ children, user, loading, tabValue, onTabChange, onProfileUpdate }: any) {
  const [tabsOrientation, setTabsOrientation] = useState<any>("horizontal");
  const [uploading, setUploading] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<any>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
    icon: "check",
    title: ""
  });

  // Initialize avatar when user data changes
  useEffect(() => {
    if (user && user.avatar) {
      setAvatarSrc(getUserAvatar());
    }
  }, [user]);

  useEffect(() => {
    // A function that sets the orientation state of the tabs.
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    /** 
     The event listener that's calling the handleTabsOrientation function when resizing the window.
    */
    window.addEventListener("resize", handleTabsOrientation);

    // Call the handleTabsOrientation function to set the state with the initial value.
    handleTabsOrientation();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  const handleSetTabValue = (event, newValue) => {
    if (onTabChange) {
      onTabChange(newValue);
    }
  };

  // Format user display name
  const getDisplayName = () => {
    if (loading) return "Loading...";
    
    if (user) {
      if (user.first_name || user.last_name) {
        return `${user.first_name || ''} ${user.last_name || ''}`.trim();
      }
      return user.username || "User";
    }
    
    return "User";
  };

  // Get user role/position
  const getUserRole = () => {
    if (loading) return "Loading...";
    
    if (user) {
      if (user.is_superuser) return "Admin";
      if (user.is_staff) return "Staff";
      if (user.title) return user.title;
      return "User";
    }
    
    return "User";
  };

  // Get user avatar
  const getUserAvatar = () => {
    if (user && user.avatar) {
      // Check if it's a full URL
      if (typeof user.avatar === 'string') {
        if (user.avatar.startsWith("http://") || user.avatar.startsWith("https://")) {
          return user.avatar;
        } else {
          return `${API_BASE}${user.avatar}`;
        }
      }
    }
    return defaultAvatar;
  };

  // Handle avatar upload
  const handleAvatarChange = async (file) => {
    console.log("Avatar change handler called with file:", file);
    
    if (!file) {
      console.error("No file provided to handleAvatarChange");
      return;
    }
    
    try {
      setUploading(true);
      console.log("Starting avatar upload...");
      
      // Create FormData manually
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Log the FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      // Upload the avatar using the userApi
      const response = await userApi.uploadAvatar(file);
      console.log("Avatar upload response:", response);
      
      // Check if the response is successful and contains the new avatar URL
      if (response && (response.avatar_url || response.avatar)) {
        const newAvatarUrl = response.avatar_url || response.avatar;
        console.log("New avatar URL:", newAvatarUrl);
        
        // Set the new avatar URL directly
        setAvatarSrc(newAvatarUrl);
        
        // Create an updated profile with the new avatar URL
        const updatedProfile = {
          ...user,
          avatar: newAvatarUrl
        };
        
        // Notify parent component to update the profile data
        if (onProfileUpdate) {
          console.log("Notifying parent component of profile update");
          onProfileUpdate(updatedProfile);
        }
        
        // Show success notification
        setNotification({
          open: true,
          message: response.message || "Your profile picture has been successfully updated",
          severity: "success",
          icon: "check",
          title: "Avatar Updated"
        });
      } else {
        console.error("Avatar update failed: No URL in response", response);
        throw new Error("Avatar update failed: No URL received from server");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      
      // Keep using the original avatar
      setAvatarSrc(getUserAvatar());
      
      // Show error notification
      setNotification({
        open: true,
        message: error.message || "Failed to update profile picture",
        severity: "error",
        icon: "error",
        title: "Upload Failed"
      });
    } finally {
      setUploading(false);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Determine which avatar source to use
  const displayAvatar = avatarSrc || getUserAvatar();

  return (
    <MDBox position="relative" mb={5}>
      <MDBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="18.75rem"
        borderRadius="xl"
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.info.main, 0.6),
              rgba(gradients.info.state, 0.6)
            )}, url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "50%",
          overflow: "hidden",
        }}
      />
      <Card
        sx={{
          position: "relative",
          mt: -8,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            {loading ? (
              <Skeleton variant="circular" width={80} height={80} />
            ) : (
              <ProfileAvatar 
                src={displayAvatar} 
                size="xl" 
                onAvatarChange={handleAvatarChange}
                disabled={loading || uploading}
              />
            )}
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              {loading ? (
                <>
                  <Skeleton variant="text" width={120} height={30} />
                  <Skeleton variant="text" width={80} height={20} />
                </>
              ) : (
                <>
                  <MDTypography variant="h5" fontWeight="medium">
                    {getDisplayName()}
                  </MDTypography>
                  <MDTypography variant="button" color="text" fontWeight="regular">
                    {getUserRole()}
                  </MDTypography>
                </>
              )}
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ ml: "auto" }}>
            <AppBar position="static">
              <Tabs 
                orientation={tabsOrientation} 
                value={tabValue} 
                onChange={handleSetTabValue}
              >
                <Tab
                  label="Overview"
                  icon={
                    <Icon fontSize="small" sx={{ mt: -0.25 }}>
                      home
                    </Icon>
                  }
                />
                <Tab
                  label="Settings"
                  icon={
                    <Icon fontSize="small" sx={{ mt: -0.25 }}>
                      settings
                    </Icon>
                  }
                />
              </Tabs>
            </AppBar>
          </Grid>
        </Grid>
        {children}
      </Card>

      {/* Notification for avatar upload status */}
      <MDSnackbar
        color={notification.severity}
        icon={notification.icon}
        title={notification.title}
        content={notification.message}
        dateTime=""
        open={notification.open}
        close={handleCloseNotification}
        onClose={handleCloseNotification}
      />
    </MDBox>
  );
}

// Setting default props for the Header
Header.defaultProps = {
  children: "",
  user: null,
  loading: false,
  tabValue: 0,
  onTabChange: null,
  onProfileUpdate: null
};

// Typechecking props for the Header
Header.propTypes = {
  children: PropTypes.node,
  user: PropTypes.object,
  loading: PropTypes.bool,
  tabValue: PropTypes.number,
  onTabChange: PropTypes.func,
  onProfileUpdate: PropTypes.func
};

export default Header;