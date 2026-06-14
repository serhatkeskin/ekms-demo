import { useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';
import MDInput from 'components/MDInput/MDInput';
import MDAlert from 'components/MDAlert/MDAlert';

// Import user API
import userApi from "services/userApi";

function PasswordManagement({ onPasswordChanged }) {
  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle password dialog open/close
  const handleOpenPasswordDialog = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError(null);
    setPasswordDialogOpen(true);
  };
  
  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password update
  const handleUpdatePassword = async () => {
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      setPasswordError(null);
      
      // Use userApi service to change password
      await userApi.changePassword(
        passwordForm.currentPassword, 
        passwordForm.newPassword
      );
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Close dialog
      handleClosePasswordDialog();
      
      // Notify parent component
      if (onPasswordChanged) {
        onPasswordChanged({
          success: true,
          message: "Your password has been successfully updated"
        });
      }
      
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card sx={{ height: "100%", boxShadow: "none" }}>
        <MDBox p={2}>
          <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
            Password Management
          </MDTypography>
        </MDBox>
        <MDBox p={2}>
          <MDBox mt={3} mb={1} textAlign="center">
            <MDButton 
              variant="gradient" 
              color="warning" 
              onClick={handleOpenPasswordDialog}
            >
              Change Password
            </MDButton>
          </MDBox>
          <MDBox mt={2}>
            <MDTypography variant="button" color="text" fontWeight="regular">
              Keep your password secure by changing it regularly. Use a strong password that includes uppercase and lowercase letters, numbers, and special characters.
            </MDTypography>
          </MDBox>
        </MDBox>
      </Card>
      
      {/* Change Password Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <MDTypography variant="h5" fontWeight="medium">
            Change Your Password
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          <MDBox p={2}>
            {passwordError && (
              <MDBox mb={2}>
                <MDAlert color="error" dismissible>
                  <MDTypography variant="body2" color="white">
                    {passwordError}
                  </MDTypography>
                </MDAlert>
              </MDBox>
            )}
            
            <MDBox mt={3}>
              <MDInput
                type="password"
                label="Current Password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                fullWidth
                disabled={loading}
              />
            </MDBox>
            
            <MDBox mt={2}>
              <MDInput
                type="password"
                label="New Password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                fullWidth
                disabled={loading}
              />
            </MDBox>
            
            <MDBox mt={2}>
              <MDInput
                type="password"
                label="Confirm New Password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                fullWidth
                disabled={loading}
              />
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton 
            onClick={handleClosePasswordDialog}
            color="primary"
          >
            Cancel
          </MDButton>
          <MDButton 
            onClick={handleUpdatePassword}
            variant="contained" 
            color="warning"
            disabled={
              loading || 
              !passwordForm.currentPassword || 
              !passwordForm.newPassword || 
              !passwordForm.confirmPassword
            }
          >
            Update Password
          </MDButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default PasswordManagement;