import { useState, useEffect } from "react";

// @mui material components
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

// EKMS React components
import MDBox from 'components/MDBox/MDBox';
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';

interface MembershipDialogProps {
  open: boolean;
  onClose: () => void;
  membership: any; // null for add, object for edit
  onSave: (data: { user: any, role: string }) => void;
  users: any[];
  roles: any[];
  existingMembers: any[];
}

function MembershipDialog({
  open,
  onClose,
  membership,
  onSave,
  users,
  roles,
  existingMembers
}: MembershipDialogProps) {
  const [form, setForm] = useState<{ user: any; role: string }>({ user: null, role: "" });
  const [error, setError] = useState<string | null>(null);

  // Update form when membership prop changes
  useEffect(() => {
    if (membership) {
      setForm({
        user: membership.user,
        role: membership.role.slug
      });
    } else {
      setForm({ user: null, role: "" });
    }
    setError(null);
  }, [membership, open]);

  const handleChange = (e: any, newValue: any, fieldName: string) => {
    if (fieldName === 'user') {
      const updatedForm = { ...form, user: newValue };
      
      // Check if selected user already exists in the project
      if (newValue && existingMembers.length > 0) {
        const existingMembership = existingMembers.find(
          m => m.user.username === newValue.username
        );
        
        if (existingMembership) {
          // Pre-fill the role with existing role
          updatedForm.role = existingMembership.role.slug;
        }
      }
      setForm(updatedForm);
    } else if (fieldName === 'role') {
        // Fix included here: extract slug from role object
        setForm({ ...form, role: newValue ? newValue.slug : "" });
    }
  };

  const handleSave = () => {
    if (!form.user) {
      setError("Please select a user");
      return;
    }
    if (!form.role) {
      setError("Please select a role");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '10px' }
      }}
    >
      <DialogTitle>
        <MDTypography variant="h5" fontWeight="medium">
          {membership ? "Edit Team Member" : "Add Team Member"}
        </MDTypography>
      </DialogTitle>
      <DialogContent>
        <MDBox p={2}>
          <MDBox mb={3}>
            <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
              Select User
            </MDTypography>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => {
                if (!option) return "";
                const displayName = `${option.username || ""} - ${option.first_name || ""} ${option.last_name || ""}`;
                
                // Check if this user is already in the project
                const existingMembership = existingMembers.find(
                  m => m.user.username === option.username
                );
                
                if (existingMembership) {
                  return `${displayName} (Current: ${existingMembership.role.name})`;
                }
                
                return displayName;
              }}
              value={form.user}
              onChange={(event, newValue) => handleChange(event, newValue, 'user')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  placeholder="Search for user"
                  helperText={
                    form.user && existingMembers.some(
                      m => m.user.username === form.user.username
                    ) && !membership ? "This user is already a member. Selecting will update their role." : ""
                  }
                />
              )}
              disabled={!!membership}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
                const existingMembership = existingMembers.find(
                  m => m.user.username === option.username
                );
                
                return (
                  <li {...props}>
                    <MDBox>
                      <MDTypography variant="body2">
                        {option.username} - {option.first_name || ""} {option.last_name || ""}
                      </MDTypography>
                      {existingMembership && (
                        <MDTypography variant="caption" color="warning.main">
                          Current role: {existingMembership.role.name}
                        </MDTypography>
                      )}
                    </MDBox>
                  </li>
                );
              }}
            />
          </MDBox>
          
          <MDBox mb={2}>
            <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
              Role
            </MDTypography>
            <Autocomplete
              options={roles}
              getOptionLabel={(option) => option?.name || ""}
              value={roles.find(role => role.slug === form.role) || null}
              onChange={(event, newValue) => handleChange(event, newValue, 'role')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  placeholder="Search for role"
                  error={!form.role && error?.includes("role")}
                  helperText={!form.role && error?.includes("role") ? "Please select a role" : ""}
                />
              )}
              isOptionEqualToValue={(option, value) => option.slug === value?.slug}
            />
          </MDBox>
          
          {/* Show warning if user already exists */}
          {form.user && existingMembers.some(
            m => m.user.username === form.user.username
          ) && !membership && (
            <MDBox 
              mt={2} 
              p={2} 
              bgcolor="warning.light" 
              borderRadius="5px"
              border="1px solid"
              borderColor="warning.main"
            >
              <MDTypography variant="body2" color="warning.dark">
                <strong>Note:</strong> This user is already a member of the project. 
                Saving will update their existing role instead of creating a new membership.
              </MDTypography>
            </MDBox>
          )}

          {error && !error.includes("role") && (
             <MDTypography variant="caption" color="error" display="block" mt={1}>
               {error}
             </MDTypography>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <MDButton onClick={onClose} variant="text" color="secondary">
          Cancel
        </MDButton>
        <MDButton onClick={handleSave} variant="gradient" color="warning">
          {membership ? 'Update Role' : 
           (form.user && existingMembers.some(
             m => m.user.username === form.user.username
           ) ? 'Update Role' : 'Add Member')}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default MembershipDialog;
