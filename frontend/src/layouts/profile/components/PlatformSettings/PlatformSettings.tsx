import { useState, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import MDButton from 'components/MDButton/MDButton';
import MDInput from 'components/MDInput/MDInput';

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDAlert from 'components/MDAlert/MDAlert';

// Import user API
import userApi from "services/userApi"; // You'll need to import this

function PlatformSettings() {
  // Default state for settings
  const [settings, setSettings] = useState({
    emailNotifications: {
      followsMe: true,
      answersPost: false,
      mentionsMe: true
    },
    applicationSettings: {
      newLaunches: false,
      productUpdates: true,
      newsletter: false
    }
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

  // Fetch user settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        // This is where you would fetch settings from the API
        // For now, we'll just use a timeout to simulate API call
        setTimeout(() => {
          // This would be replaced with actual API call
          // const response = await userApi.getSettings();
          // setSettings(response);
          setLoadingSettings(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching user settings:", error);
        setAlert({
          show: true,
          type: 'error',
          message: 'Failed to load settings. Please try again.'
        });
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle toggle for settings switches
  const handleToggle = (section, setting) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: !prev[section][setting]
      }
    }));

    // Save the setting to the server
    // This would typically be debounced in a real application
    saveSettings(section, setting, !settings[section][setting]);
  };

  // Save settings to server
  const saveSettings = async (section, setting, value) => {
    try {
      setLoading(true);
      
      // Construct the settings update object
      const settingUpdate = {
        [`${section}.${setting}`]: value
      };
      
      // This is where you would update the setting via API
      // await userApi.updateSettings(settingUpdate);
      
      // Show success message
      setAlert({
        show: true,
        type: 'success',
        message: 'Setting updated successfully'
      });
      
      // Auto-hide the alert after 3 seconds
      setTimeout(() => {
        setAlert({ show: false, type: 'success', message: '' });
      }, 3000);
    } catch (error) {
      console.error("Error saving setting:", error);
      setAlert({
        show: true,
        type: 'error',
        message: 'Failed to save setting. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card sx={{ boxShadow: "none", height: "100%" }}>
      <MDBox p={2}>
        <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          Platform Settings
        </MDTypography>
      </MDBox>
      
      {/* Settings Alert */}
      {alert.show && (
        <MDBox mx={2} mb={2}>
          <MDAlert color={alert.type} dismissible onClose={() => setAlert({...alert, show: false})}>
            {alert.message}
          </MDAlert>
        </MDBox>
      )}
      
      {loadingSettings ? (
        <MDBox display="flex" justifyContent="center" p={4}>
          <CircularProgress size={24} />
        </MDBox>
      ) : (
        <>
          <MDBox pt={1} pb={2} px={2} lineHeight={1.25}>
            <MDTypography variant="caption" fontWeight="bold" color="text" textTransform="uppercase">
              Email Notifications
            </MDTypography>
            
            <MDBox display="flex" alignItems="center" mb={0.5} ml={-1.5}>
              <MDBox mt={0.5}>
                <Switch 
                  checked={settings.emailNotifications.followsMe} 
                  onChange={() => handleToggle('emailNotifications', 'followsMe')} 
                  disabled={loading}
                />
              </MDBox>
              <MDBox width="80%" ml={0.5}>
                <MDTypography variant="button" fontWeight="regular" color="text">
                  Email me when someone follows me
                </MDTypography>
              </MDBox>
            </MDBox>
            
            <MDBox display="flex" alignItems="center" mb={0.5} ml={-1.5}>
              <MDBox mt={0.5}>
                <Switch 
                  checked={settings.emailNotifications.answersPost} 
                  onChange={() => handleToggle('emailNotifications', 'answersPost')} 
                  disabled={loading}
                />
              </MDBox>
              <MDBox width="80%" ml={0.5}>
                <MDTypography variant="button" fontWeight="regular" color="text">
                  Email me when someone answers on my post
                </MDTypography>
              </MDBox>
            </MDBox>
            
            <MDBox display="flex" alignItems="center" mb={0.5} ml={-1.5}>
              <MDBox mt={0.5}>
                <Switch 
                  checked={settings.emailNotifications.mentionsMe} 
                  onChange={() => handleToggle('emailNotifications', 'mentionsMe')} 
                  disabled={loading}
                />
              </MDBox>
              <MDBox width="80%" ml={0.5}>
                <MDTypography variant="button" fontWeight="regular" color="text">
                  Email me when someone mentions me
                </MDTypography>
              </MDBox>
            </MDBox>
            
            <MDBox mt={3}>
              <MDTypography variant="caption" fontWeight="bold" color="text" textTransform="uppercase">
                Application Settings
              </MDTypography>
            </MDBox>
            
            <MDBox display="flex" alignItems="center" mb={0.5} ml={-1.5}>
              <MDBox mt={0.5}>
                <Switch 
                  checked={settings.applicationSettings.newLaunches} 
                  onChange={() => handleToggle('applicationSettings', 'newLaunches')} 
                  disabled={loading}
                />
              </MDBox>
              <MDBox width="80%" ml={0.5}>
                <MDTypography variant="button" fontWeight="regular" color="text">
                  New launches and projects
                </MDTypography>
              </MDBox>
            </MDBox>
            
            <MDBox display="flex" alignItems="center" mb={0.5} ml={-1.5}>
              <MDBox mt={0.5}>
                <Switch 
                  checked={settings.applicationSettings.productUpdates} 
                  onChange={() => handleToggle('applicationSettings', 'productUpdates')} 
                  disabled={loading}
                />
              </MDBox>
              <MDBox width="80%" ml={0.5}>
                <MDTypography variant="button" fontWeight="regular" color="text">
                  Monthly product updates
                </MDTypography>
              </MDBox>
            </MDBox>
            
            <MDBox display="flex" alignItems="center" mb={0.5} ml={-1.5}>
              <MDBox mt={0.5}>
                <Switch 
                  checked={settings.applicationSettings.newsletter} 
                  onChange={() => handleToggle('applicationSettings', 'newsletter')} 
                  disabled={loading}
                />
              </MDBox>
              <MDBox width="80%" ml={0.5}>
                <MDTypography variant="button" fontWeight="regular" color="text">
                  Subscribe to newsletter
                </MDTypography>
              </MDBox>
            </MDBox>
          </MDBox>
        </>
      )}
    </Card>
  );
}

export default PlatformSettings;