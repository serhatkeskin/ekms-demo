// src/components/Pages/SnapshotManager.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  TextField,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import RestoreIcon from '@mui/icons-material/Restore';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import pageApi from 'services/pageApi';
import MDButton from 'components/MDButton/MDButton';
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDInput from 'components/MDInput/MDInput';
import MDSnackbar from 'components/MDSnackbar/MDSnackbar';

// Toolbar styled button
const ToolbarButton = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  padding: '10px 16px',
  borderRadius: '8px',
  fontSize: '0.8125rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

const ButtonLabel = styled('span')({
  fontSize: '0.8125rem',
  fontWeight: 500,
  letterSpacing: '0.02em',
});

/**
 * SnapshotManager component for creating and restoring page snapshots
 */
const SnapshotManager = ({ slug, onSnapshotRestored, canCreateSnapshots, variant = 'default' }: any) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    snapshotId: null,
    type: 'restore' // 'restore' or 'delete'
  });
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [snapshotCreated, setSnapshotCreated] = useState(false);
  
  // State for snapshot naming
  const [snapshotName, setSnapshotName] = useState("");
  const [editingSnapshotId, setEditingSnapshotId] = useState(null);
  const [editingSnapshotName, setEditingSnapshotName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "success" // "success", "error", "info", "warning"
  });

  // Load snapshots when dialog opens
  useEffect(() => {
    if (open) {
      loadSnapshots();
    }
  }, [open]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await pageApi.getSnapshots(slug);
      setSnapshots(response.content?.snapshots || []);
    } catch (err) {
      console.error('Error loading snapshots:', err);
      setError('Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    // Reset the snapshot name when opening the dialog
    setSnapshotName("");
  };

  const handleClose = () => {
    setOpen(false);
    setSnapshotCreated(false);
    // Reset editing state
    setEditingSnapshotId(null);
    setEditingSnapshotName("");
  };

  const showNotification = (message, type = "success") => {
    setNotification({
      open: true,
      message,
      type
    });
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setNotification(prev => ({...prev, open: false}));
    }, 4000);
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({...prev, open: false}));
  };

  const handleCreateSnapshot = async () => {
    try {
      setCreatingSnapshot(true);
      setError(null);
      
      // Pass the snapshot name to the API
      await pageApi.createSnapshot(slug, snapshotName);
      
      // Reset the name field
      setSnapshotName("");
      
      // Reload snapshots after creation
      await loadSnapshots();
      setSnapshotCreated(true);
      
      // Show notification
      showNotification("Snapshot created successfully");
      
      // Hide the success message after 3 seconds
      setTimeout(() => {
        setSnapshotCreated(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating snapshot:', err);
      setError('Failed to create snapshot');
      showNotification("Failed to create snapshot", "error");
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleConfirmAction = (snapshotId, type) => {
    setConfirmDialog({
      open: true,
      snapshotId,
      type
    });
  };

  const handleCloseConfirm = () => {
    setConfirmDialog({
      open: false,
      snapshotId: null,
      type: 'restore'
    });
  };

  const handleRestoreSnapshot = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await pageApi.restoreSnapshot(slug, confirmDialog.snapshotId);
      
      // Close dialogs
      handleCloseConfirm();
      handleClose();
      
      // Show notification
      showNotification("Snapshot restored successfully");
      
      // Notify parent that restoration has occurred
      if (onSnapshotRestored) {
        onSnapshotRestored();
      }
    } catch (err) {
      console.error('Error restoring snapshot:', err);
      setError('Failed to restore snapshot');
      showNotification("Failed to restore snapshot", "error");
      handleCloseConfirm();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSnapshot = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await pageApi.deleteSnapshot(slug, confirmDialog.snapshotId);
      
      // Update local state to remove the deleted snapshot
      setSnapshots(prevSnapshots => 
        prevSnapshots.filter(snapshot => snapshot.id !== confirmDialog.snapshotId)
      );
      
      // Close dialog
      handleCloseConfirm();
      
      // Show notification
      showNotification("Snapshot deleted successfully");
    } catch (err) {
      console.error('Error deleting snapshot:', err);
      setError('Failed to delete snapshot');
      showNotification("Failed to delete snapshot", "error");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Start editing a snapshot name
  const handleStartEditName = (snapshot) => {
    setEditingSnapshotId(snapshot.id);
    setEditingSnapshotName(snapshot.name || "");
  };

  // Cancel editing a snapshot name
  const handleCancelEditName = () => {
    setEditingSnapshotId(null);
    setEditingSnapshotName("");
  };

  // Save edited snapshot name
  const handleSaveSnapshotName = async () => {
    if (!editingSnapshotId) return;
    
    try {
      setUpdatingName(true);
      setError(null);
      
      await pageApi.updateSnapshotName(slug, editingSnapshotId, editingSnapshotName);
      
      // Update snapshots in state
      const updatedSnapshots = snapshots.map(snapshot => 
        snapshot.id === editingSnapshotId 
          ? { ...snapshot, name: editingSnapshotName }
          : snapshot
      );
      
      setSnapshots(updatedSnapshots);
      
      // Show notification
      showNotification("Snapshot name updated successfully");
      
      // Reset editing state
      setEditingSnapshotId(null);
      setEditingSnapshotName("");
    } catch (err) {
      console.error('Error updating snapshot name:', err);
      setError('Failed to update snapshot name');
      showNotification("Failed to update snapshot name", "error");
    } finally {
      setUpdatingName(false);
    }
  };

  // Handle confirmation action (restore or delete)
  const handleConfirmationAction = () => {
    if (confirmDialog.type === 'restore') {
      handleRestoreSnapshot();
    } else if (confirmDialog.type === 'delete') {
      handleDeleteSnapshot();
    }
  };

  // Get dialog title and content based on action type
  const getDialogConfig = () => {
    if (confirmDialog.type === 'restore') {
      return {
        title: "Confirm Restore",
        icon: <WarningIcon color="warning" sx={{ mr: 1 }} />,
        content: (
          <>
            <Typography variant="body1">
              Are you sure you want to restore this snapshot? This will replace the current page content with the version from the snapshot.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>
              This action cannot be undone. Any changes made since this snapshot was created will be lost.
            </Typography>
          </>
        ),
        buttonText: "Restore Snapshot",
        buttonIcon: <RestoreIcon />
      };
    } else {
      return {
        title: "Confirm Delete",
        icon: <WarningIcon color="error" sx={{ mr: 1 }} />,
        content: (
          <>
            <Typography variant="body1">
              Are you sure you want to delete this snapshot? This will permanently remove it from the system.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>
              This action cannot be undone.
            </Typography>
          </>
        ),
        buttonText: "Delete Snapshot",
        buttonIcon: <DeleteIcon />
      };
    }
  };

  const dialogConfig = getDialogConfig();

  // Render trigger button based on variant
  const renderTriggerButton = () => {
    if (variant === 'toolbar') {
      return (
        <Tooltip title="Manage page snapshots" arrow placement="bottom">
          <span>
            <ToolbarButton
              onClick={handleOpen}
              disabled={!canCreateSnapshots}
            >
              <HistoryIcon />
              <ButtonLabel>Snapshots</ButtonLabel>
            </ToolbarButton>
          </span>
        </Tooltip>
      );
    }

    return (
      <MDButton
        variant="contained"
        color="dark"
        onClick={handleOpen}
        disabled={!canCreateSnapshots}
        startIcon={<HistoryIcon />}
      >
        Snapshots
      </MDButton>
    );
  };

  return (
    <>
      {renderTriggerButton()}

      {/* Main Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Page Snapshots
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <MDBox mb={3}>
            <MDTypography variant="body2" color="text">
              Snapshots allow you to save the current state of the page and restore it later.
              Create a snapshot before making significant changes to create a backup.
            </MDTypography>
          </MDBox>
          
          <MDBox mb={3}>
            {/* Add a name input field */}
            <MDBox mb={2}>
              <MDInput
                label="Snapshot Name (Optional)"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="E.g., Before redesign, Final draft, Version 2.0"
                fullWidth
              />
            </MDBox>
            
            <MDButton
              variant="contained"
              color="info"
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot || !canCreateSnapshots}
              startIcon={<SaveIcon />}
              fullWidth
            >
              {creatingSnapshot ? 'Creating Snapshot...' : 'Create Snapshot'}
            </MDButton>
            
            {snapshotCreated && (
              <MDBox mt={1} p={1} bgcolor="success.light" borderRadius={1}>
                <MDTypography variant="body2" color="success.dark">
                  Snapshot created successfully!
                </MDTypography>
              </MDBox>
            )}
          </MDBox>
          
          {error && (
            <MDBox mb={3} p={2} bgcolor="error.light" borderRadius={1}>
              <MDTypography variant="body2" color="error">
                {error}
              </MDTypography>
            </MDBox>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
            Available Snapshots
          </MDTypography>
          
          {loading ? (
            <MDBox display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </MDBox>
          ) : snapshots.length > 0 ? (
            <List>
              {snapshots.map((snapshot) => (
                <React.Fragment key={snapshot.id}>
                  <ListItem>
                    {editingSnapshotId === snapshot.id ? (
                      // Editing mode for snapshot name
                      <MDBox width="100%" display="flex" alignItems="center">
                        <MDInput
                          value={editingSnapshotName}
                          onChange={(e) => setEditingSnapshotName(e.target.value)}
                          placeholder="Enter snapshot name"
                          fullWidth
                          autoFocus
                          disabled={updatingName}
                        />
                        <IconButton 
                          color="success" 
                          onClick={handleSaveSnapshotName}
                          disabled={updatingName}
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={handleCancelEditName}
                          disabled={updatingName}
                        >
                          <CancelIcon />
                        </IconButton>
                      </MDBox>
                    ) : (
                      // Display mode
                      <>
                        <ListItemText
                          primary={
                            <MDBox>
                              {snapshot.name ? (
                                <MDTypography variant="body2" fontWeight="medium">
                                  {snapshot.name}
                                </MDTypography>
                              ) : (
                                <MDTypography variant="body2" color="text.secondary" fontStyle="italic">
                                  Unnamed Snapshot
                                </MDTypography>
                              )}
                              <MDTypography variant="caption" color="text.secondary">
                                {formatDate(snapshot.created_at)}
                              </MDTypography>
                            </MDBox>
                          }
                          secondary={`Created by: ${snapshot.created_by}`}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Edit Name">
                            <IconButton 
                              edge="end" 
                              aria-label="edit name"
                              onClick={() => handleStartEditName(snapshot)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Restore Snapshot">
                            <IconButton 
                              edge="end" 
                              aria-label="restore"
                              onClick={() => handleConfirmAction(snapshot.id, 'restore')}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Snapshot">
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleConfirmAction(snapshot.id, 'delete')}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <MDBox textAlign="center" p={2}>
              <InfoIcon color="info" sx={{ mb: 1, fontSize: 40 }} />
              <MDTypography variant="body2" color="text">
                No snapshots available. Create your first snapshot to back up the current state of the page.
              </MDTypography>
            </MDBox>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            {dialogConfig.icon}
            {dialogConfig.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {dialogConfig.content}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseConfirm} color="info">
            Cancel
          </MDButton>
          <MDButton 
            onClick={handleConfirmationAction} 
            color={confirmDialog.type === 'delete' ? "error" : "primary"} 
            variant="contained"
            startIcon={dialogConfig.buttonIcon}
          >
            {dialogConfig.buttonText}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <MDSnackbar
        color={notification.type}
        icon={notification.type === "success" ? "check" : "warning"}
        title={notification.type === "success" ? "Success" : "Notification"}
        content={notification.message}
        open={notification.open}
        onClose={handleCloseNotification}
        close={handleCloseNotification}
        bgWhite
      />
    </>
  );
};

SnapshotManager.propTypes = {
  slug: PropTypes.string.isRequired,
  onSnapshotRestored: PropTypes.func,
  canCreateSnapshots: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'toolbar'])
};

SnapshotManager.defaultProps = {
  onSnapshotRestored: () => {},
  canCreateSnapshots: false,
  variant: 'default'
};

export default SnapshotManager;