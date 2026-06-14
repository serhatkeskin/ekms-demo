// src/components/Project/RolesManagement.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import Icon from "@mui/material/Icon";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';
import MDInput from 'components/MDInput/MDInput';
import MDAlert from 'components/MDAlert/MDAlert';

// API service
import projectsApi from 'services/projectApi';

const RolesManagement = ({ open, onClose }: any) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    can_view: true,
    can_create: false,
    can_edit: false,
    can_delete: false,
    is_supermanager: false
  });
  const [editingRole, setEditingRole] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch roles on component mount or when dialog opens
  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectsApi.getRoles();
      setRoles(response.content.data.results || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Failed to load roles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // In the createRole function, add success message after successful creation
  const createRole = async () => {
    try {
      setLoading(true);
      setError('');
      await projectsApi.createRole(newRole);
      // Reset form
      setNewRole({
        name: '',
        description: '',
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
        is_supermanager: false
      });
      setIsAdding(false);
      // Set success message
      setSuccessMessage(`Role "${newRole.name}" successfully created`);
      // Refresh roles list
      await fetchRoles();
    } catch (err) {
      console.error('Failed to create role:', err);
      setError('Failed to create role. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // In the updateRole function, add success message after successful update
  const updateRole = async () => {
    if (!editingRole) return;
    
    try {
      setLoading(true);
      setError('');
      await projectsApi.updateRole(editingRole.id, editingRole);
      setEditingRole(null);
      // Set success message
      setSuccessMessage(`Role "${editingRole.name}" successfully updated`);
      // Refresh roles list
      await fetchRoles();
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update role. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (roleId) => {
    try {
      setLoading(true);
      setError('');
      await projectsApi.deleteRole(roleId);
      // Refresh roles list
      await fetchRoles();
    } catch (err) {
      console.error('Failed to delete role:', err);
      setError('Failed to delete role. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, isForEdit = false) => {
    const { name, value, checked } = e.target;
    const isSwitch = e.target.type === 'checkbox';
    
    if (isForEdit) {
      setEditingRole({
        ...editingRole,
        [name]: isSwitch ? checked : value
      });
    } else {
      setNewRole({
        ...newRole,
        [name]: isSwitch ? checked : value
      });
    }
  };

  const renderRolesList = () => (
    <MDBox p={1}>
      <MDBox
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={1.5}
        sx={{ backgroundColor: "background.default", borderRadius: 1 }}
      >
        <MDBox width="25%">
          <MDTypography variant="button" color="text" fontWeight="medium">
            Role Name
          </MDTypography>
        </MDBox>
        <MDBox width="25%">
          <MDTypography variant="button" color="text" fontWeight="medium">
            Description
          </MDTypography>
        </MDBox>
        <MDBox width="35%" display="flex" justifyContent="space-between">
          <MDTypography variant="button" color="text" fontWeight="medium">
            Permissions
          </MDTypography>
        </MDBox>
        <MDBox width="15%" textAlign="center">
          <MDTypography variant="button" color="text" fontWeight="medium">
            Actions
          </MDTypography>
        </MDBox>
      </MDBox>
      
      {roles.length === 0 ? (
        <MDBox p={2} textAlign="center">
          <MDTypography variant="body2" color="text">
            No roles found. Create your first role with the button above.
          </MDTypography>
        </MDBox>
      ) : (
        roles.map((role) => (
          <MDBox
            key={role.id}
            p={1.5}
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": { borderBottom: "none" }
            }}
          >
            {editingRole && editingRole.id === role.id ? (
              <MDBox display="flex" alignItems="center">
                <MDBox width="25%" pr={1}>
                  <MDInput
                    name="name"
                    value={editingRole.name}
                    onChange={(e) => handleInputChange(e, true)}
                    fullWidth
                  />
                </MDBox>
                <MDBox width="25%" pr={1}>
                  <MDInput
                    name="description"
                    value={editingRole.description || ''}
                    onChange={(e) => handleInputChange(e, true)}
                    fullWidth
                  />
                </MDBox>
                <MDBox width="35%" display="flex" flexWrap="wrap" gap={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="can_view"
                        checked={editingRole.can_view}
                        onChange={(e) => handleInputChange(e, true)}
                        size="small"
                      />
                    }
                    label={<MDTypography variant="caption">View</MDTypography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        name="can_create"
                        checked={editingRole.can_create}
                        onChange={(e) => handleInputChange(e, true)}
                        size="small"
                      />
                    }
                    label={<MDTypography variant="caption">Create</MDTypography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        name="can_edit"
                        checked={editingRole.can_edit}
                        onChange={(e) => handleInputChange(e, true)}
                        size="small"
                      />
                    }
                    label={<MDTypography variant="caption">Edit</MDTypography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        name="can_delete"
                        checked={editingRole.can_delete}
                        onChange={(e) => handleInputChange(e, true)}
                        size="small"
                      />
                    }
                    label={<MDTypography variant="caption">Delete</MDTypography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        name="is_supermanager"
                        checked={editingRole.is_supermanager}
                        onChange={(e) => handleInputChange(e, true)}
                        size="small"
                      />
                    }
                    label={<MDTypography variant="caption">Manager</MDTypography>}
                  />
                </MDBox>
                <MDBox width="15%" display="flex" justifyContent="flex-end">
                  <MDButton
                    variant="text"
                    color="secondary"
                    onClick={() => setEditingRole(null)}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </MDButton>
                  <MDButton
                    variant="gradient"
                    color="warning"
                    onClick={updateRole}
                  >
                    Save
                  </MDButton>
                </MDBox>
              </MDBox>
            ) : (
              <MDBox display="flex" alignItems="center">
                <MDBox width="25%">
                  <MDTypography variant="body2" fontWeight="medium">
                    {role.name}
                  </MDTypography>
                </MDBox>
                <MDBox width="25%">
                  <MDTypography variant="body2" color="text">
                    {role.description || '-'}
                  </MDTypography>
                </MDBox>
                <MDBox width="35%" display="flex" flexWrap="wrap" gap={1}>
                  <MDBox display="flex" alignItems="center" mr={1}>
                    <Icon 
                      fontSize="small" 
                      color={role.can_view ? "success" : "error"}
                      sx={{ mr: 0.5 }}
                    >
                      {role.can_view ? "check_circle" : "cancel"}
                    </Icon>
                    <MDTypography variant="caption" color="text">
                      View
                    </MDTypography>
                  </MDBox>
                  <MDBox display="flex" alignItems="center" mr={1}>
                    <Icon 
                      fontSize="small" 
                      color={role.can_create ? "success" : "error"}
                      sx={{ mr: 0.5 }}
                    >
                      {role.can_create ? "check_circle" : "cancel"}
                    </Icon>
                    <MDTypography variant="caption" color="text">
                      Create
                    </MDTypography>
                  </MDBox>
                  <MDBox display="flex" alignItems="center" mr={1}>
                    <Icon 
                      fontSize="small" 
                      color={role.can_edit ? "success" : "error"}
                      sx={{ mr: 0.5 }}
                    >
                      {role.can_edit ? "check_circle" : "cancel"}
                    </Icon>
                    <MDTypography variant="caption" color="text">
                      Edit
                    </MDTypography>
                  </MDBox>
                  <MDBox display="flex" alignItems="center" mr={1}>
                    <Icon 
                      fontSize="small" 
                      color={role.can_delete ? "success" : "error"}
                      sx={{ mr: 0.5 }}
                    >
                      {role.can_delete ? "check_circle" : "cancel"}
                    </Icon>
                    <MDTypography variant="caption" color="text">
                      Delete
                    </MDTypography>
                  </MDBox>
                  <MDBox display="flex" alignItems="center">
                    <Icon 
                      fontSize="small" 
                      color={role.is_supermanager ? "success" : "error"}
                      sx={{ mr: 0.5 }}
                    >
                      {role.is_supermanager ? "check_circle" : "cancel"}
                    </Icon>
                    <MDTypography variant="caption" color="text">
                      Manager
                    </MDTypography>
                  </MDBox>
                </MDBox>
                <MDBox width="15%" display="flex" justifyContent="flex-end">
                  <MDButton
                    variant="text"
                    color="info"
                    onClick={() => setEditingRole({...role})}
                    sx={{ minWidth: 'auto', p: 1 }}
                  >
                    <Icon fontSize="small">edit</Icon>
                  </MDButton>
                  <MDButton
                    variant="text"
                    color="error"
                    onClick={() => deleteRole(role.id)}
                    sx={{ minWidth: 'auto', p: 1 }}
                  >
                    <Icon fontSize="small">delete</Icon>
                  </MDButton>
                </MDBox>
              </MDBox>
            )}
          </MDBox>
        ))
      )}
    </MDBox>
  );

  const renderAddRoleForm = () => (
    <MDBox mt={2} mb={3} p={2} sx={{ backgroundColor: "grey.100", borderRadius: 1 }}>
      <MDTypography variant="h6" color="text" fontWeight="medium" mb={2}>
        Create New Role
      </MDTypography>
      
      <MDBox mb={2}>
        <MDInput
          label="Role Name"
          name="name"
          value={newRole.name}
          onChange={(e) => handleInputChange(e)}
          fullWidth
          required
        />
      </MDBox>
      
      <MDBox mb={2}>
        <MDInput
          label="Description"
          name="description"
          value={newRole.description}
          onChange={(e) => handleInputChange(e)}
          multiline
          rows={2}
          fullWidth
        />
      </MDBox>
      
      <MDBox display="flex" flexWrap="wrap" gap={2} mb={2}>
        <FormControlLabel
          control={
            <Switch
              checked={newRole.can_view}
              onChange={(e) => handleInputChange(e)}
              name="can_view"
            />
          }
          label={<MDTypography variant="button">Can View</MDTypography>}
        />

        <FormControlLabel
          control={
            <Switch
              checked={newRole.can_create}
              onChange={(e) => handleInputChange(e)}
              name="can_create"
            />
          }
          label={<MDTypography variant="button">Can Create</MDTypography>}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={newRole.can_edit}
              onChange={(e) => handleInputChange(e)}
              name="can_edit"
            />
          }
          label={<MDTypography variant="button">Can Edit</MDTypography>}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={newRole.can_delete}
              onChange={(e) => handleInputChange(e)}
              name="can_delete"
            />
          }
          label={<MDTypography variant="button">Can Delete</MDTypography>}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={newRole.is_supermanager}
              onChange={(e) => handleInputChange(e)}
              name="is_supermanager"
            />
          }
          label={<MDTypography variant="button">Super Manager</MDTypography>}
        />
      </MDBox>
      
      <MDBox display="flex" justifyContent="flex-end">
        <MDButton
          variant="text"
          color="secondary"
          onClick={() => setIsAdding(false)}
          sx={{ mr: 1 }}
        >
          Cancel
        </MDButton>
        <MDButton
          variant="gradient"
          color="warning"
          onClick={createRole}
          disabled={!newRole.name}
        >
          Save Role
        </MDButton>
      </MDBox>
    </MDBox>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px'
        }
      }}
    >
      <DialogTitle>
        <MDTypography variant="h5" fontWeight="medium">
          Project Roles Management
        </MDTypography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <MDAlert color="error" mb={2}>
            <MDTypography variant="body2" color="white">
              {error}
            </MDTypography>
          </MDAlert>
        )}

        {successMessage && (
          <MDAlert color="success" mb={2} dismissible onClose={() => setSuccessMessage('')}>
            <MDTypography variant="body2" color="white">
              {successMessage}
            </MDTypography>
          </MDAlert>
        )}
        
        <MDBox mb={3} mt={2}>
          <MDButton 
            variant="gradient" 
            color="warning" 
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Icon fontSize="small">add</Icon>&nbsp;
            Add New Role
          </MDButton>
        </MDBox>
        
        {isAdding && renderAddRoleForm()}
        
        <MDBox sx={{ backgroundColor: 'white', borderRadius: 1, boxShadow: 1 }}>
          {loading ? (
            <MDBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress color="warning" />
            </MDBox>
          ) : (
            renderRolesList()
          )}
        </MDBox>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <MDButton onClick={onClose} variant="gradient" color="secondary">
          Close
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

export default RolesManagement;