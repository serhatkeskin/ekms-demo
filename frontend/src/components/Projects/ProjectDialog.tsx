import { useState, useEffect, useMemo } from "react";

// @mui material components
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// EKMS React components
import MDBox from 'components/MDBox/MDBox';
import MDButton from 'components/MDButton/MDButton';
import MDTypography from 'components/MDTypography/MDTypography';
import MDInput from 'components/MDInput/MDInput';
import DataTable from 'examples/Tables/DataTable/DataTable';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: any; // null for create, object for edit
  onSave: (data: { name: string, description: string, logo: File | null }) => void;
  
  // Member management props
  members: any[];
  onAddMember: () => void;
  onEditMember: (member: any) => void;
  onDeleteMember: (member: any) => void;
  showNotification: (color: string, title: string, content: string) => void;
}

function ProjectDialog({
  open,
  onClose,
  project,
  onSave,
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  showNotification
}: ProjectDialogProps) {
  const [form, setForm] = useState({ name: "", description: "", logo: null as File | null });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (open) {
      if (project) {
        setForm({ 
          name: project.name, 
          description: project.description || "",
          logo: null
        });
        setLogoPreview(project.logo || null);
      } else {
        setForm({ name: "", description: "", logo: null });
        setLogoPreview(null);
      }
      setLogoRemoved(false);
    }
  }, [project, open]);

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLogoChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showNotification("error", "Invalid File Type", "Please select a valid image file (JPEG, PNG, or GIF)");
        return;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showNotification("error", "File Too Large", "Please select an image smaller than 5MB");
        return;
      }
      
      setForm({ ...form, logo: file });
      setLogoRemoved(false);
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(form);
  };

  // Create members table data
  const membersTableData = useMemo(() => ({
    columns: [
      { Header: "User", accessor: "user", width: "60%" },
      { Header: "Role", accessor: "role", width: "25%" },
      { Header: "Actions", accessor: "actions", width: "15%", align: "right" },
    ],
    rows: members.map((membership: any) => ({
      user: (
        <MDTypography variant="button" fontWeight="medium">
          {membership.user.username} - {membership.user.first_name || ""} {membership.user.last_name || ""}
        </MDTypography>
      ),
      role: (
        <MDBox>
          <MDTypography variant="button" fontWeight="medium">
            {membership.role.name}
          </MDTypography>
        </MDBox>
      ),
      actions: (
        <MDBox display="flex" justifyContent="flex-end">
          <MDButton 
            variant="text" 
            color="info" 
            onClick={() => onEditMember(membership)}
          >
            <Icon color="warning">edit</Icon>
          </MDButton>
          <MDButton 
            variant="text" 
            color="error" 
            onClick={() => onDeleteMember(membership)}
          >
            <Icon>delete</Icon>
          </MDButton>
        </MDBox>
      ),
    })),
  }), [members, onEditMember, onDeleteMember]);

  return (
    <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '10px' }
        }}
    >
      <DialogTitle>
        <MDTypography variant="h5" fontWeight="medium">
          {project ? `Edit Project: ${project.name}` : "Create New Project"}
        </MDTypography>
      </DialogTitle>
      <DialogContent>
        <MDBox p={2}>
          <Grid container spacing={2}>
            {/* Logo Upload Section */}
            <Grid item xs={12}>
              <MDBox mb={2}>
                <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                  Project Logo
                </MDTypography>
                
                <MDBox display="flex" alignItems="center" gap={2}>
                  {/* Logo Preview */}
                  <Avatar
                    src={logoPreview || undefined}
                    alt="Project Logo"
                    sx={{ width: 80, height: 80 }}
                    variant="rounded"
                  />
                  
                  <MDBox>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-upload"
                      type="file"
                      onChange={handleLogoChange}
                    />
                    <label htmlFor="logo-upload">
                      <MDButton
                        variant="outlined"
                        component="span"
                        color="warning"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mr: 1, mb: 1 }}
                      >
                        Upload Logo
                      </MDButton>
                    </label>
                    
                    <MDBox>
                      <MDTypography variant="caption" color="text">
                        Supported formats: JPEG, PNG, GIF (Max 5MB)
                      </MDTypography>
                      {logoRemoved && (
                        <MDTypography variant="caption" color="warning" display="block">
                          Logo will be reset to default when saved
                        </MDTypography>
                      )}
                    </MDBox>
                  </MDBox>
                </MDBox>
              </MDBox>
            </Grid>
            
            <Grid item xs={12}>
              <MDBox mb={2}>
                <MDInput
                  autoFocus
                  fullWidth
                  name="name"
                  label="Project Name"
                  type="text"
                  value={form.name}
                  onChange={handleFormChange}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12}>
              <MDBox mb={2}>
                <TextField
                  name="description"
                  label="Description"
                  type="text"
                  fullWidth
                  multiline
                  rows={4}
                  value={form.description}
                  onChange={handleFormChange}
                  margin="normal"
                  variant="outlined"
                />
              </MDBox>
            </Grid>
          </Grid>

          {/* Project Members Section */}
          {project && (
            <MDBox mt={3}>
              <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                <Grid item>
                  <MDTypography variant="h6" fontWeight="medium">
                    Project Members
                  </MDTypography>
                </Grid>
                <Grid item>
                  <MDButton
                    variant="gradient"
                    color="warning"
                    startIcon={<Icon>add</Icon>}
                    onClick={onAddMember}
                  >
                    Add Member
                  </MDButton>
                </Grid>
              </Grid>

              <MDBox mt={2}>
                {members.length === 0 ? (
                  <MDBox p={2} textAlign="center">
                    <MDTypography variant="button" color="text">
                      No members added to this project yet
                    </MDTypography>
                  </MDBox>
                ) : (
                  <DataTable 
                    table={membersTableData}
                    isSorted={false}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    noEndBorder
                  />
                )}
              </MDBox>
            </MDBox>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <MDButton onClick={onClose} variant="text" color="secondary">
          Cancel
        </MDButton>
        <MDButton onClick={handleSave} variant="gradient" color="warning">
          Save
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

export default ProjectDialog;
