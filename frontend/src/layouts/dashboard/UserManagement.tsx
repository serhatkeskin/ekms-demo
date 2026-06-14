import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField, 
  FormControlLabel, 
  Switch,
  Autocomplete,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';
import MDAlert from 'components/MDAlert/MDAlert';
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable/DataTable";
import { useAuth } from "contexts/auth/AuthContext";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import userApi from "services/userApi";

function UserManagement() {
  const [auth] = useAuth();
  const { user } = auth;

  const [users, setUsers] = useState<any>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [availablePermissions, setAvailablePermissions] = useState<any>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Create user form state
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    is_active: true,
    is_staff: false,
  });
  const [createUserPermissions, setCreateUserPermissions] = useState<any>([]);
  const [createUserError, setCreateUserError] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Get superuser status from AuthContext
  const isSuperUser = user?.is_superuser || false;
  console.log("isSuperUser:", isSuperUser)

  const fetchUsers = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await userApi.getUsers(page, size);
      
      // Extract user data and pagination info from response
      const usersData = data.content.data.results || [];
      const pageInfo = data.content.data.page || {};
      
      setUsers(usersData);
      setTotalUsers(data.content.data.count || 0);
      setTotalPages(pageInfo.total || 1);
      
      return usersData;
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to load users. Please try again later.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch users whenever page or pageSize changes
    fetchUsers();
    
    // Fetch available permissions only once
    const fetchAvailablePermissions = async () => {
      // Only fetch permissions if the user is a superuser
      if (!isSuperUser) return;

      try {
        const data = await userApi.getPermissions();
        setAvailablePermissions(data.results || []);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    fetchAvailablePermissions();
  }, [currentPage, pageSize, isSuperUser]);

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setError(null);
    setPasswordError("");
    setPasswordSuccess("");
    setNewPassword("");
    setConfirmPassword("");
    
    // Only fetch user permissions if the current user is a superuser
    if (isSuperUser) {
      try {
        setLoading(true);
        const data = await userApi.getUserPermissions(user.pk);
        let userPermissions = data.content.data.results;
        setSelectedPermissions(userPermissions);
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        setSelectedPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    setEditDialogOpen(true);
  };

  const handleCreateUser = () => {
    setCreateUserForm({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
      is_active: true,
      is_staff: false,
    });
    setCreateUserPermissions([]);
    setCreateUserError("");
    setCreateDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      setError(null);
      
      await userApi.deleteUser(userToDelete.pk);
      
      setSuccessMessage(`User "${userToDelete.username}" has been deleted successfully.`);
      
      // Refresh the current page of users
      await fetchUsers();
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(error.message || "Failed to delete user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setSelectedPermissions([]);
    setError(null);
    setPasswordError("");
    setPasswordSuccess("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateUserForm({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
      is_active: true,
      is_staff: false,
    });
    setCreateUserPermissions([]);
    setCreateUserError("");
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = selectedUser.pk;
      
      // Update user information
      await userApi.updateUser(userId, {
        username: selectedUser.username,
        email: selectedUser.email,
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        is_active: selectedUser.is_active,
        is_staff: selectedUser.is_staff,
      });

      // Update user permissions if current user is superuser
      if (isSuperUser) {
        // Ensure we're getting valid permission IDs from each permission object
        const permissionIds = selectedPermissions.map(permission => {
          // Check if the permission object has an ID property and return it
          if (permission && permission.id) {
            return permission.id;
          } else if (permission && permission.pk) {
            return permission.pk;
          } else if (typeof permission === 'number') {
            return permission;
          }
          
          // Log for debugging and return null if no valid ID found
          console.error("Invalid permission object:", permission);
          return null;
        }).filter(id => id !== null); // Filter out any null values
        
        try {
          await userApi.updateUserPermissions(userId, permissionIds);
          console.log("Permissions updated successfully");
        } catch (error) {
          console.error("Failed to update user permissions:", error);
        }
      }

      setSuccessMessage(`User "${selectedUser.username}" has been updated successfully.`);
      
      // Refresh the current page of users
      await fetchUsers();
      
      handleCloseEditDialog();
    } catch (error) {
      console.error("Error saving user:", error);
      setError(error.message || "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserSave = async () => {
    setCreateUserError("");

    // Validation
    if (!createUserForm.username) {
      setCreateUserError("Username is required");
      return;
    }

    if (!createUserForm.email) {
      setCreateUserError("Email is required");
      return;
    }

    if (!createUserForm.password) {
      setCreateUserError("Password is required");
      return;
    }

    if (createUserForm.password.length < 8) {
      setCreateUserError("Password must be at least 8 characters long");
      return;
    }

    if (createUserForm.password !== createUserForm.confirm_password) {
      setCreateUserError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      
      // Create user data object (without password - will be set separately)
      const userData = {
        username: createUserForm.username,
        email: createUserForm.email,
        first_name: createUserForm.first_name,
        last_name: createUserForm.last_name,
        is_active: createUserForm.is_active,
        is_staff: createUserForm.is_staff,
      };

      // Create the user first
      const response = await userApi.createUser(userData);
      const newUserId = response.content.pk || response.content.id;
      
      // Set password using the change password API
      try {
        await userApi.changeUserPassword(newUserId, createUserForm.password);
      } catch (passwordError) {
        console.error("Failed to set initial password for new user:", passwordError);
        setCreateUserError("User created but failed to set password. Please edit the user to set a password.");
        // Don't return here - continue with permissions and success message
      }
      
      // If user is a superuser and permissions are selected, assign them
      if (isSuperUser && createUserPermissions.length > 0) {
        const permissionIds = createUserPermissions.map(permission => {
          if (permission && permission.id) {
            return permission.id;
          } else if (permission && permission.pk) {
            return permission.pk;
          } else if (typeof permission === 'number') {
            return permission;
          }
          return null;
        }).filter(id => id !== null);
        
        try {
          await userApi.updateUserPermissions(newUserId, permissionIds);
        } catch (error) {
          console.error("Failed to assign permissions to new user:", error);
        }
      }

      setSuccessMessage(`User "${createUserForm.username}" has been created successfully.`);
      
      // Refresh the current page of users
      await fetchUsers();
      
      handleCloseCreateDialog();
    } catch (error) {
      console.error("Error creating user:", error);
      setCreateUserError(error.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Reset status messages
    setPasswordError("");
    setPasswordSuccess("");
    
    // Validate passwords
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);
      const userId = selectedUser.pk;
      
      await userApi.changeUserPassword(userId, newPassword);
      
      setPasswordSuccess("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle page change from DataTable
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  // Handle page size change from DataTable
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleCreatePasswordVisibility = () => {
    setShowCreatePassword(!showCreatePassword);
  };

  const toggleIsActive = () => {
    setSelectedUser((prevState) => ({
      ...prevState,
      is_active: !prevState.is_active,
    }));
  };

  const toggleIsStaff = () => {
    setSelectedUser((prevState) => ({
      ...prevState,
      is_staff: !prevState.is_staff,
    }));
  };

  const toggleCreateIsActive = () => {
    setCreateUserForm((prevState) => ({
      ...prevState,
      is_active: !prevState.is_active,
    }));
  };

  const toggleCreateIsStaff = () => {
    setCreateUserForm((prevState) => ({
      ...prevState,
      is_staff: !prevState.is_staff,
    }));
  };

  const handlePermissionChange = (event, newValue) => {
    // Ensure we're creating a new array with unique permissions
    const uniquePermissions = newValue.filter((permission, index, self) => 
      index === self.findIndex((p) => 
        (p.id || p.pk) === (permission.id || permission.pk)
      )
    );
  
    setSelectedPermissions(uniquePermissions);
  };

  const handleCreateUserPermissionChange = (event, newValue) => {
    // Ensure we're creating a new array with unique permissions
    const uniquePermissions = newValue.filter((permission, index, self) => 
      index === self.findIndex((p) => 
        (p.id || p.pk) === (permission.id || permission.pk)
      )
    );
  
    setCreateUserPermissions(uniquePermissions);
  };

  const handleCreateUserFormChange = (e) => {
    const { name, value } = e.target;
    setCreateUserForm({
      ...createUserForm,
      [name]: value
    });
  };

  const columns = [
    // { Header: "ID", accessor: "id", width: "8%" },
    { Header: "Email", accessor: "email", width: "28%" },
    { Header: "Username", accessor: "username", width: "15%" },
    { Header: "First Name", accessor: "first_name", width: "15%" },
    { Header: "Last Name", accessor: "last_name", width: "15%" },
    { Header: "Active", accessor: "is_active", width: "8%" },
    { Header: "Staff", accessor: "is_staff", width: "8%" },
    { Header: "Actions", accessor: "actions", width: "15%" },
  ];

  const rows = users.map((user) => ({
    id: user.pk,
    username: user.username,
    first_name: user.first_name || "-",
    last_name: user.last_name || "-",
    email: user.email || "-",
    is_active: user.is_active ? "Yes" : "No",
    is_staff: user.is_staff ? "Yes" : "No",
    actions: (
      <MDBox display="flex" gap={1}>
        <MDButton 
          variant="gradient" 
          color="warning" 
          size="small"
          onClick={() => handleEditUser(user)}
        >
          Edit
        </MDButton>
        {/* <MDButton 
          variant="gradient" 
          color="error" 
          size="small"
          onClick={() => handleDeleteUser(user)}
          disabled={user.pk === auth.user?.pk} // Prevent self-deletion
        >
          Delete
        </MDButton> */}
      </MDBox>
    ),
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar 
        breadcrumbs={[
          {
            slug: "management/user",
            title: "User Management"
          }
        ]}
      />
      <MDBox py={3}>

        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="warning"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  User Management
                </MDTypography>
              </MDBox>
                {/* Header section with Create User button */}
                <MDBox mt={2} mx={2}>
                  <Grid container spacing={3} justifyContent="flex-end" alignItems="center">
                  
                    {/* Only show "Create User" button if user is a superuser */}
                    {isSuperUser && (
                      <Grid item>
                        <MDButton
                          variant="gradient"
                          color="warning"
                          startIcon={<Icon>add</Icon>}
                          onClick={handleCreateUser}
                        >
                          Create User
                        </MDButton>
                      </Grid>
                    )}
                  </Grid>
                </MDBox>
              <MDBox pt={3}>
                {successMessage && (
                  <MDBox p={2}>
                    <MDAlert color="success" dismissible onClose={() => setSuccessMessage("")}>
                      {successMessage}
                    </MDAlert>
                  </MDBox>
                )}
                
                {error && !loading && (
                  <MDBox p={2}>
                    <MDAlert color="error" dismissible onClose={() => setError(null)}>
                      {error}
                    </MDAlert>
                  </MDBox>
                )}
                
                {loading && !editDialogOpen && !deleteDialogOpen && !createDialogOpen ? (
                  <MDBox p={2} textAlign="center">
                    <CircularProgress color="warning" />
                    <MDTypography variant="body2" mt={2}>Loading users...</MDTypography>
                  </MDBox>
                ) : (
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={true}
                    entriesPerPage={{
                      defaultValue: pageSize,
                      entries: [5, 10, 15, 20, 25, 50],
                    }}
                    showTotalEntries={true}
                    pagination={{
                      variant: "gradient",
                      color: "warning",
                    }}
                    canSearch={true}
                    noEndBorder
                    manualPagination={true}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalUsers}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Create User Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <MDTypography variant="h5" fontWeight="medium">
            Create New User
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          <MDBox p={2}>
            {createUserError && (
              <MDBox mb={2}>
                <MDAlert color="error">
                  {createUserError}
                </MDAlert>
              </MDBox>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Username *"
                  name="username"
                  value={createUserForm.username}
                  onChange={handleCreateUserFormChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email *"
                  name="email"
                  type="email"
                  value={createUserForm.email}
                  onChange={handleCreateUserFormChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  name="first_name"
                  value={createUserForm.first_name}
                  onChange={handleCreateUserFormChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  name="last_name"
                  value={createUserForm.last_name}
                  onChange={handleCreateUserFormChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password *"
                  name="password"
                  type={showCreatePassword ? "text" : "password"}
                  value={createUserForm.password}
                  onChange={handleCreateUserFormChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={showCreatePassword ? "Hide password" : "Show password"}>
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={toggleCreatePasswordVisibility}
                            edge="end"
                          >
                            {showCreatePassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Confirm Password *"
                  name="confirm_password"
                  type={showCreatePassword ? "text" : "password"}
                  value={createUserForm.confirm_password}
                  onChange={handleCreateUserFormChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={showCreatePassword ? "Hide password" : "Show password"}>
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={toggleCreatePasswordVisibility}
                            edge="end"
                          >
                            {showCreatePassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <MDBox mt={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={createUserForm.is_active}
                        onChange={toggleCreateIsActive}
                        name="is_active"
                        color="primary"
                      />
                    }
                    label="Active"
                  />
                </MDBox>
              </Grid>
              <Grid item xs={12} md={6}>
                <MDBox mt={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={createUserForm.is_staff}
                        onChange={toggleCreateIsStaff}
                        name="is_staff"
                        color="primary"
                      />
                    }
                    label="Staff Status"
                  />
                </MDBox>
              </Grid>
              
              {/* Permissions field for new user */}
              {isSuperUser && (
                <Grid item xs={12}>
                  <MDBox mt={2}>
                    <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                      User Permissions
                    </MDTypography>
                    <Autocomplete
                      multiple
                      id="create-permissions-autocomplete"
                      options={availablePermissions}
                      value={createUserPermissions}
                      onChange={handleCreateUserPermissionChange}
                      getOptionLabel={(option) => option.name || option.codename || ""}
                      isOptionEqualToValue={(option, value) => 
                        (option.id && option.id === value.id) || 
                        (option.pk && option.pk === value.pk)
                      }
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option.name || option.codename || String(option.id || option.pk || '')}
                            {...getTagProps({ index })}
                            key={option.id || option.pk || index}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label="Select Permissions"
                          placeholder="Type to search"
                          fullWidth
                        />
                      )}
                    />
                  </MDBox>
                </Grid>
              )}
            </Grid>
          </MDBox>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <MDButton
            onClick={handleCloseCreateDialog}
            sx={{ 
              color: '#1976d2',
              borderRadius: '4px',
              padding: '8px 16px',
              textTransform: 'uppercase'
            }}
          >
            Cancel
          </MDButton>
          <MDButton
            onClick={handleCreateUserSave}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            Create User
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <MDTypography variant="h5" fontWeight="medium">
            {selectedUser ? `Edit User: ${selectedUser.username}` : "Edit User"}
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <MDBox py={2} textAlign="center">
              <CircularProgress color="warning" />
              <MDTypography variant="body2" mt={2}>Loading user data...</MDTypography>
            </MDBox>
          ) : (
            <MDBox p={2}>
              {error && (
                <MDBox mb={2}>
                  <MDAlert color="error">
                    {error}
                  </MDAlert>
                </MDBox>
              )}
              
              {selectedUser && (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Username"
                        value={selectedUser.username}
                        onChange={(e) =>
                          setSelectedUser({ ...selectedUser, username: e.target.value })
                        }
                        fullWidth
                        margin="normal"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Email"
                        value={selectedUser.email || ""}
                        onChange={(e) =>
                          setSelectedUser({ ...selectedUser, email: e.target.value })
                        }
                        fullWidth
                        margin="normal"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="First Name"
                        value={selectedUser.first_name || ""}
                        onChange={(e) =>
                          setSelectedUser({ ...selectedUser, first_name: e.target.value })
                        }
                        fullWidth
                        margin="normal"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Last Name"
                        value={selectedUser.last_name || ""}
                        onChange={(e) =>
                          setSelectedUser({ ...selectedUser, last_name: e.target.value })
                        }
                        fullWidth
                        margin="normal"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDBox mt={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={selectedUser.is_active}
                              onChange={toggleIsActive}
                              name="is_active"
                              color="primary"
                            />
                          }
                          label="Active"
                        />
                      </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDBox mt={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={selectedUser.is_staff}
                              onChange={toggleIsStaff}
                              name="is_staff"
                              color="primary"
                            />
                          }
                          label="Staff Status"
                        />
                      </MDBox>
                    </Grid>
                    
                    {/* Permissions field - only visible to superusers */}
                    {isSuperUser && (
                      <Grid item xs={12}>
                        <MDBox mt={2}>
                          <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                            User Permissions
                          </MDTypography>
                          <Autocomplete
                            multiple
                            id="permissions-autocomplete"
                            options={availablePermissions}
                            value={selectedPermissions}
                            onChange={handlePermissionChange}
                            getOptionLabel={(option) => option.name || option.codename || ""}
                            isOptionEqualToValue={(option, value) => 
                              (option.id && option.id === value.id) || 
                              (option.pk && option.pk === value.pk)
                            }
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  variant="outlined"
                                  label={option.name || option.codename || String(option.id || option.pk || '')}
                                  {...getTagProps({ index })}
                                  key={option.id || option.pk || index}
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                label="Select Permissions"
                                placeholder="Type to search"
                                fullWidth
                              />
                            )}
                          />
                        </MDBox>
                      </Grid>
                    )}
                  </Grid>
                  
                  {/* Password Change Section */}
                  <MDBox mt={4} mb={2}>
                    <Divider />
                    <MDBox mt={3} mb={1}>
                      <MDTypography variant="h6" fontWeight="medium">
                        Change Password
                      </MDTypography>
                    </MDBox>
                    
                    {passwordSuccess && (
                      <MDBox mt={2} mb={2}>
                        <MDAlert color="success">
                          {passwordSuccess}
                        </MDAlert>
                      </MDBox>
                    )}
                    
                    {passwordError && (
                      <MDBox mt={2} mb={2}>
                        <MDAlert color="error">
                          {passwordError}
                        </MDAlert>
                      </MDBox>
                    )}
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          fullWidth
                          margin="normal"
                          variant="outlined"
                          type={showPassword ? "text" : "password"}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                                  <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={togglePasswordVisibility}
                                    edge="end"
                                  >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          fullWidth
                          margin="normal"
                          variant="outlined"
                          type={showPassword ? "text" : "password"}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                                  <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={togglePasswordVisibility}
                                    edge="end"
                                  >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <MDBox display="flex" justifyContent="flex-end">
                          <MDButton
                            variant="gradient"
                            color="info"
                            onClick={handleChangePassword}
                            disabled={loading || !newPassword || !confirmPassword}
                          >
                            Change Password
                          </MDButton>
                        </MDBox>
                      </Grid>
                    </Grid>
                  </MDBox>
                </>
              )}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <MDButton
            onClick={handleCloseEditDialog}
            sx={{ 
              color: '#1976d2',
              borderRadius: '4px',
              padding: '8px 16px',
              textTransform: 'uppercase'
            }}
          >
            Cancel
          </MDButton>
          <MDButton
            onClick={handleSaveUser}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            Save
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <MDTypography variant="h5" fontWeight="medium" color="error">
            Confirm Delete User
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          <MDBox p={2}>
            {userToDelete && (
              <MDTypography variant="body1">
                Are you sure you want to delete the user <strong>"{userToDelete.username}"</strong>?
                <br />
                <br />
                <MDTypography variant="body2" color="error" fontWeight="medium">
                  This action cannot be undone and will permanently remove all user data.
                </MDTypography>
              </MDTypography>
            )}
          </MDBox>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <MDButton
            onClick={handleCloseDeleteDialog}
            disabled={loading}
            sx={{ 
              color: '#1976d2',
              borderRadius: '4px',
              padding: '8px 16px',
              textTransform: 'uppercase'
            }}
          >
            Cancel
          </MDButton>
          <MDButton
            onClick={confirmDeleteUser}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Delete User"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default UserManagement;