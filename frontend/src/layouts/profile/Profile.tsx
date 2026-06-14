// @mui material components
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

// User API for data operations
import userApi from "services/userApi"; 

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDAlert from 'components/MDAlert/MDAlert';
import MDSnackbar from "components/MDSnackbar/MDSnackbar";
import MDPagination from 'components/MDPagination/MDPagination';

// EKMS React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar/DashboardNavbar";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard/ProfileInfoCard";

// Profile page components
import Header from "layouts/profile/components/Header/Header";
import PlatformSettings from "layouts/profile/components/PlatformSettings/PlatformSettings";
import PasswordManagement from "layouts/profile/components/PasswordManagement/PasswordManagement";
import UserProjects from "layouts/profile/components/UserProjects/UserProjects";

// Auth context
import { useAuth } from "contexts/auth/AuthContext";


function Profile() {
  const [auth] = useAuth();
  const { user } = auth;
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  
  // Initialize notification state with a default icon
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
    icon: "check",
    title: ""
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [projectsPerPage, setProjectsPerPage] = useState(4);
  
  // Handle tab change from Header component
  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  // Fetch user profile data - using useCallback to prevent recreating on every render
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || !user.username) {
        throw new Error("User not authenticated");
      }

      // Use the userApi service to fetch profile data
      const profileData = await userApi.getProfile();
      setUserProfile(profileData);
      
      // Fetch user's projects 
      try {
        const projectsData = await userApi.getUserProjects();
        const formattedProjects = projectsData.results || projectsData.content?.data?.results || [];
        setProjects(formattedProjects);
      } catch (projectErr) {
        console.error("Error fetching projects:", projectErr);
        // Don't set main error for projects fetch failure
      }
      
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch data only once when component mounts or user changes
  useEffect(() => {
    fetchUserData();
    
    // Important: Clean up any pending requests or timers
    return () => {
      // Any cleanup needed here
    };
  }, [fetchUserData]);

  // Handle profile update
  const handleUpdateProfile = async (updatedInfo) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for update
      const updateData = {
        first_name: updatedInfo.firstName || userProfile.first_name || "",
        last_name: updatedInfo.lastName || userProfile.last_name || "",
        email: updatedInfo.email || userProfile.email || "",
        cell_phone: updatedInfo.cell_phone || userProfile.cell_phone || "",
        location: updatedInfo.location || userProfile.location || "",
        bio: updatedInfo.bio || userProfile.bio || ""
      };

      // Use userApi to update profile
      const updatedProfile = await userApi.updateProfile(updateData);
      setUserProfile(updatedProfile);
      
      // Show success notification with proper icon
      setNotification({
        open: true,
        message: "Your profile has been successfully updated",
        severity: "success",
        icon: "check",
        title: "Profile Updated"
      });
      
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
      
      // Show error notification with proper icon
      setNotification({
        open: true,
        message: err.message || "Failed to update profile",
        severity: "error",
        icon: "error",
        title: "Update Failed"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar update from the Header component
  const handleProfileAvatarUpdate = (updatedProfile) => {
    // Update the profile data with the new avatar
    if (updatedProfile) {
      setUserProfile(prevProfile => ({
        ...prevProfile,
        ...updatedProfile
      }));
    }
  };

  // Handle notification from password management component
  const handlePasswordChanged = (result) => {
    if (result.success) {
      setNotification({
        open: true,
        message: result.message || "Password updated successfully",
        severity: "success",
        icon: "check",
        title: "Password Updated"
      });
    } else {
      setNotification({
        open: true,
        message: result.message || "Failed to update password",
        severity: "error",
        icon: "error",
        title: "Password Update Failed"
      });
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
      // Keep the existing icon when closing
      icon: notification.icon || "notifications"
    });
  };

  // Format profile data for the ProfileInfoCard component
  const formatProfileInfo = useMemo(() => {
    if (!userProfile) return {};
    
    return {
      fullName: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user?.username || 'No Name Set',
      cell_phone: userProfile.cell_phone || 'Not provided',
      email: userProfile.email || 'Not provided'
    };
  }, [userProfile, user]);

  // Generate description from bio if available
  const getProfileDescription = useMemo(() => {
    return userProfile?.bio || "No bio information provided. Edit your profile to add a bio.";
  }, [userProfile]);

  // Compute pagination values
  const totalPages = useMemo(() => Math.ceil(projects.length / projectsPerPage), [projects.length, projectsPerPage]);
  
  // Render the Overview tab content
  const renderOverviewTab = useCallback(() => (
    <>
      <MDBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ProfileInfoCard
              title="profile information"
              description={getProfileDescription}
              info={formatProfileInfo}
              social={[]}
              action={{ 
                route: "", 
                tooltip: "Edit Profile",
                onClick: () => {
                  // This will be handled by the component's internal edit functionality
                }
              }}
              onSubmit={handleUpdateProfile}
              shadow={false}
              editable={true}
            />
          </Grid>
        </Grid>
      </MDBox>
      
      <UserProjects 
        projects={projects} 
        currentPage={currentPage} 
        projectsPerPage={projectsPerPage} 
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </>
  ), [
    getProfileDescription, 
    formatProfileInfo, 
    handleUpdateProfile, 
    projects, 
    currentPage, 
    projectsPerPage, 
    totalPages,
    setCurrentPage
  ]);
  
  // Render the Settings tab content
  const renderSettingsTab = useCallback(() => (
    <MDBox mt={5} mb={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <PlatformSettings />
        </Grid>
        <Grid item xs={12} md={6}>
          <PasswordManagement onPasswordChanged={handlePasswordChanged} />
        </Grid>
      </Grid>
    </MDBox>
  ), [handlePasswordChanged]);

  // If page is loading, show loading state
  if (loading && !userProfile) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress color="warning" />
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      
      {/* Error Alert */}
      {error && (
        <MDAlert color="error" dismissible>
          <MDTypography variant="body2" color="white">
            {error}
          </MDTypography>
        </MDAlert>
      )}
      
      {/* Profile Header and Content */}
      <Header 
        user={userProfile || user} 
        loading={loading}
        onTabChange={handleTabChange}
        tabValue={activeTab}
        onProfileUpdate={handleProfileAvatarUpdate}
      >
        {/* Render tab content based on active tab */}
        {activeTab === 0 ? renderOverviewTab() : renderSettingsTab()}
      </Header>
      
      {/* Notification Snackbar */}
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
      
      <Footer />
    </DashboardLayout>
  );
}

export default Profile;