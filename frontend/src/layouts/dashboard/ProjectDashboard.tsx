import { useState, useCallback, useMemo } from "react";
import { useAuth } from 'contexts/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from 'contexts/permissions/PermissionsContext';

// @mui material components
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Icon from '@mui/material/Icon';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import SettingsIcon from '@mui/icons-material/Settings';
import Avatar from '@mui/material/Avatar';

// EKMS React components
import MDBox from 'components/MDBox/MDBox';
import MDButton from 'components/MDButton/MDButton';
import MDTypography from 'components/MDTypography/MDTypography';

// EKMS React example components
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar/DashboardNavbar';
import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable/DataTable';
import RolesManagement from 'components/Projects/RolesManagement';
import ProjectDialog from 'components/Projects/ProjectDialog';
import MembershipDialog from 'components/Projects/MembershipDialog';

// API services
import projectApi from 'services/projectApi';

// Custom hooks
import { useProjectsTable } from 'hooks/useProjectsTable';
import { useProjectMembers } from 'hooks/useProjectMembers';
import { useUI } from 'contexts/ui/UIContext';

function ProjectDashboard() {
  const navigate = useNavigate();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  
  // Notification context
  const { showNotification } = useUI();
  
  // Auth & Permissions
  const [auth] = useAuth();
  const { user } = auth;
  const isStaff = user?.is_staff || false;
  const permissions = usePermissions();

  // Use Custom Hooks
  const { 
    projects, 
    loadingData, 
    pagination, 
    filters, 
    fetchProjects, 
    deleteProject 
  } = useProjectsTable({ 
    permissions, 
    showNotification 
  });

  const {
    currentRoles,
    availableUsers,
    availableRoles,
    fetchProjectMemberships,
    fetchRoles,
    fetchUsers,
    saveMembership: hookSaveMembership,
    deleteMembership,
    setCurrentRoles
  } = useProjectMembers({ 
    showNotification 
  });

  // Open project dialog
  const openProjectDialog = async (project: any = null) => {
    if (project) {
      setCurrentProject(project);
      fetchProjectMemberships(project.slug);
    } else {
      setCurrentProject(null);
      setCurrentRoles([]);
    }
    setProjectDialogOpen(true);
  };

  // Close project dialog
  const closeProjectDialog = () => {
    setProjectDialogOpen(false);
  };

  // Open membership dialog
  const openMembershipDialog = async (membership: any = null) => {
    // Determine if we need to fetch data
    const needsFetch = !membership || availableRoles.length === 0 || availableUsers.length === 0;
    
    if (needsFetch) {
      try {
         // Should we fetch both? Only if lists are empty?
         // For now, simpler to just fetch ensuring data is fresh
        await Promise.all([fetchRoles(), fetchUsers()]);
      } catch (err) {
        console.error("Error fetching users and roles:", err);
      }
    }
    
    setCurrentMembership(membership);
    setMembershipDialogOpen(true);
  };

  // Close membership dialog
  const closeMembershipDialog = () => {
    setMembershipDialogOpen(false);
  };

  // Save project (create or update)
  const saveProject = async (data: { name: string, description: string, logo: File | null }) => {

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }
      
      if (currentProject) {
        await projectApi.updateProject(currentProject.slug, formData);
        showNotification("success", "Success", "Project updated successfully");
      } else {
        await projectApi.createProject(formData);
        showNotification("success", "Success", "Project created successfully");
      }
      
      closeProjectDialog();
      
      // Refresh list using hook function
      fetchProjects(pagination.currentPage, pagination.pageSize, {
        name: filters.name,
        status: filters.status
      });
    } catch (err) {
      console.error("Error saving project:", err);
      showNotification("error", "Error", "Failed to save project");
    }
  };

  // Wrapper for membership save
  const handleSaveMembership = (data: { user: any, role: string }) => {
    if (!currentProject) return;
    
    hookSaveMembership(
      data, 
      currentProject.slug, 
      currentMembership, 
      () => closeMembershipDialog() // onSuccess callback
    );
  };

  // Helpers
  const truncateDescription = (description: string, maxLength = 100) => {
    if (!description) return "No description";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };
  
  const handleProjectClick = (project: any) => {
    navigate(`/pages/?project=${project.slug}&parent=root`);
  };

  // Projects table data construction
  const projectsTableData = useMemo(() => ({
    columns: [
      { Header: "Logo", accessor: "logo", width: "10%" },
      { Header: "Project", accessor: "name", width: "25%" },
      { Header: "Description", accessor: "description", width: "45%" },
      { Header: "Status", accessor: "status", width: "10%" },
      { Header: "Actions", accessor: "actions", width: "20%", align: "center" },
    ],
    rows: projects.map((project: any) => ({
      logo: (
        <Avatar
          src={project.logo}
          alt={project.name}
          sx={{ width: 40, height: 40 }}
          variant="rounded"
        />
      ),
      name: (
        <MDTypography 
          variant="button" 
          fontWeight="medium" 
          onClick={() => handleProjectClick(project)}
          sx={{ cursor: "pointer" }}
        >
          {project.name}
        </MDTypography>
      ),
      description: (
        <MDTypography variant="button" color="text">
          {truncateDescription(project.description)}
        </MDTypography>
      ),
      status: (
        <MDBox>
          {project.status === 1 ? (
            <MDBox display="inline-block" bgcolor="success.main" color="info" px={1} py={0.5} borderRadius="1" fontSize="xs">Private</MDBox>
          ) : project.status === 2 ? (
            <MDBox display="inline-block" bgcolor="text.secondary" color="error" px={1} py={0.5} borderRadius="1" fontSize="xs">Public</MDBox>
          ) : project.status === 3 ? (
            <MDBox display="inline-block" bgcolor="text.secondary" color="info" px={1} py={0.5} borderRadius="1" fontSize="xs">Archived</MDBox>
          ): (
            <MDBox display="inline-block" bgcolor="info.main" color="info" px={1} py={0.5} borderRadius="1" fontSize="xs">{project.status || 'Unknown'}</MDBox>
          )}
        </MDBox>
      ),
      actions: (
        <MDBox display="flex" justifyContent="flex-end">
          {permissions.canEditProject(project) ? (
            <>
              <MDButton 
                variant="text" 
                color="info" 
                onClick={(e: any) => {
                  e.stopPropagation();
                  openProjectDialog(project);
                }}
              >
                <Icon color="warning">edit</Icon>
              </MDButton>
              {permissions.canDeleteProject(project) && (
                <MDButton 
                  variant="text" 
                  color="error"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    deleteProject(project);
                  }}
                >
                  <Icon>delete</Icon>
                </MDButton>
              )}
            </>
          ) : (
            <MDTypography variant="caption" color="text">No permission</MDTypography>
          )}
        </MDBox>
      ),
    })),
  }), [projects, permissions, deleteProject]); // Dependencies

  return (
    <DashboardLayout>
      <DashboardNavbar 
        breadcrumbs={[
          { slug: "dashboard/project", title: "Project Dashboard" }
        ]}
      />

      <MDBox py={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2} mt={-3} py={3} px={2}
                variant="gradient"
                bgColor="warning"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Project Management
                </MDTypography>
              </MDBox>
              <MDBox mt={2} mx={2}>
                <Grid container spacing={3} justifyContent="flex-end" alignItems="center">
                  {isStaff && (
                    <>
                      <Grid item>
                        <MDButton
                          variant="outlined"
                          color="warning"
                          onClick={() => setRolesModalOpen(true)}
                          startIcon={<SettingsIcon />}
                        >
                          Manage Roles
                        </MDButton>
                      </Grid>
                      <Grid item>
                        <MDButton
                          variant="gradient"
                          color="warning"
                          startIcon={<Icon>add</Icon>}
                          onClick={() => openProjectDialog()}
                        >
                          New Project
                        </MDButton>
                      </Grid>
                    </>
                  )}
                </Grid>
              </MDBox>

              {/* Filters section */}
              <MDBox mx={2} my={3}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Search by Name"
                      variant="outlined"
                      fullWidth
                      value={filters.name}
                      onChange={filters.onNameChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={filters.onStatusChange}
                        label="Status"
                        sx={{ height: '42px' }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={5} container justifyContent="flex-end" spacing={1}>
                    <Grid item>
                      <MDButton variant="outlined" color="warning" onClick={filters.reset}>
                        Reset
                      </MDButton>
                    </Grid>
                    <Grid item>
                      <MDButton variant="gradient" color="warning" onClick={filters.apply}>
                        Filter
                      </MDButton>
                    </Grid>
                  </Grid>
                </Grid>
              </MDBox>

              <MDBox pt={3}>
                {loadingData ? (
                  <MDBox display="flex" justifyContent="center" p={3}>
                    <CircularProgress color="warning" />
                    <MDTypography variant="body1" ml={2}>Loading projects...</MDTypography>
                  </MDBox>
                ) : projects.length === 0 ? (
                  <MDBox textAlign="center" p={3}>
                    <MDTypography variant="body1">
                      No projects found. {isStaff ? "Create a new project to get started." : ""}
                    </MDTypography>
                  </MDBox>
                ) : (
                  <DataTable 
                    table={projectsTableData}
                    isSorted={true}
                    entriesPerPage={{ defaultValue: pagination.pageSize, entries: [5, 10, 15, 20, 25, 50] }}
                    showTotalEntries={true}
                    pagination={{ variant: "gradient", color: "warning" }}
                    canSearch={true}
                    noEndBorder
                    manualPagination={true}
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalProjects}
                    onPageChange={pagination.onPageChange}
                    onPageSizeChange={pagination.onPageSizeChange}
                  />
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Extracted Components */}
      <ProjectDialog 
        open={projectDialogOpen}
        onClose={closeProjectDialog}
        project={currentProject}
        onSave={saveProject}
        members={currentRoles}
        onAddMember={() => openMembershipDialog(null)}
        onEditMember={(member: any) => openMembershipDialog(member)}
        onDeleteMember={deleteMembership}
        showNotification={showNotification}
      />
      
      <MembershipDialog 
        open={membershipDialogOpen}
        onClose={closeMembershipDialog}
        membership={currentMembership}
        onSave={handleSaveMembership}
        users={availableUsers}
        roles={availableRoles}
        existingMembers={currentRoles}
      />



      <Footer />
      <RolesManagement
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
      />
    </DashboardLayout>
  );
}

export default ProjectDashboard;