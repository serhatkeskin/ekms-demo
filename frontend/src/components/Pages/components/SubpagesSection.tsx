import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "contexts/auth/AuthContext";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DescriptionOutlined as PageIcon,
  ArrowForwardIos as ArrowIcon
} from '@mui/icons-material';
import MDButton from 'components/MDButton/MDButton';
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import pageApi from 'services/pageApi';
import { PAGE_STATUS } from "constants/Constants";

interface SubpagesSectionProps {
  children: any[];
  currentPageId: number;
  slug: string;
  projectId: number;
  onSubpageCreated?: (newPage: any) => void;
  onSubpageDeleted?: (deletedPageId: number) => void;
}

const SubpagesSection: React.FC<SubpagesSectionProps> = ({
  children,
  currentPageId,
  slug,
  projectId,
  onSubpageCreated,
  onSubpageDeleted
}) => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const { user } = auth || {};
  const isStaff = user?.is_staff || false;

  // Create subpage modal state
  const [openModal, setOpenModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSubpage, setSelectedSubpage] = useState<any>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEditPage = () => isStaff;

  // Create subpage handlers
  const handleOpenModal = () => {
    setOpenModal(true);
    setNewPageTitle('');
    setError(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCreateSubpage = async () => {
    if (!newPageTitle.trim()) {
      setError('Page title is required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await pageApi.createPage({
        title: newPageTitle,
        parent: currentPageId,
        project: projectId,
        status: PAGE_STATUS.DRAFT,
        properties: {}
      });

      let newPage = null;
      if (response.content && response.content.data) {
        newPage = response.content.data;
      } else if (response.content) {
        newPage = response.content;
      } else {
        newPage = response;
      }

      handleCloseModal();

      if (onSubpageCreated) {
        onSubpageCreated(newPage);
      }

      if (newPage && newPage.slug) {
        navigate(`/pages/${newPage.slug}`);
      } else {
        throw new Error('Page created but navigation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create subpage. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, subpage: any) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedSubpage(subpage);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSubpage(null);
  };

  const handleOpenPage = () => {
    if (selectedSubpage) {
      navigate(`/pages/${selectedSubpage.slug}`);
    }
    handleMenuClose();
  };

  const handleOpenInNewTab = () => {
    if (selectedSubpage) {
      window.open(`/pages/${selectedSubpage.slug}`, '_blank');
    }
    handleMenuClose();
  };

  const handleEditPage = () => {
    if (selectedSubpage) {
      navigate(`/pages/${selectedSubpage.slug}?edit=true`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubpage) return;

    try {
      setIsDeleting(true);
      await pageApi.deletePage(selectedSubpage.slug);

      if (onSubpageDeleted) {
        onSubpageDeleted(selectedSubpage.id);
      }

      setDeleteDialogOpen(false);
      setSelectedSubpage(null);
    } catch (err: any) {
      console.error('Error deleting subpage:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedSubpage(null);
  };

  // Don't render if no children and user can't edit
  if ((!children || children.length === 0) && !canEditPage()) {
    return null;
  }

  return (
    <Box className="subpages-section">
      {/* Header */}
      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <MDTypography variant="h6" fontWeight="medium" sx={{ color: 'text.secondary' }}>
          Subpages
        </MDTypography>

        {canEditPage() && (
          <MDButton
            variant="text"
            color="warning"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'rgba(255, 152, 0, 0.08)'
              }
            }}
          >
            Add subpage
          </MDButton>
        )}
      </MDBox>

      {/* Subpages List */}
      {(!children || children.length === 0) ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            px: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            border: '1px dashed rgba(0, 0, 0, 0.12)'
          }}
        >
          <PageIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <MDTypography variant="body2" color="text" sx={{ textAlign: 'center' }}>
            No subpages yet
          </MDTypography>
          {canEditPage() && (
            <MDTypography variant="caption" color="text" sx={{ mt: 0.5, opacity: 0.7 }}>
              Click "Add subpage" to create one
            </MDTypography>
          )}
        </Box>
      ) : (
        <Box className="subpages-list">
          {children.map((child) => (
            <Box
              key={child.id}
              className="subpage-item"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 152, 0, 0.04)',
                borderLeft: '3px solid',
                borderImage: 'linear-gradient(180deg, #ff9800 0%, #f57c00 100%) 1',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  '& .subpage-arrow': {
                    opacity: 1,
                    transform: 'translateX(2px)'
                  },
                  '& .subpage-menu': {
                    opacity: 1
                  }
                }
              }}
              onClick={() => navigate(`/pages/${child.slug}`)}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flex: 1,
                  minWidth: 0
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    flexShrink: 0
                  }}
                >
                  {child.icon ? (
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>{child.icon}</span>
                  ) : (
                    <PageIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                  )}
                </Box>

                {/* Title */}
                <MDTypography
                  variant="body2"
                  fontWeight="medium"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'text.primary'
                  }}
                >
                  {child.title}
                </MDTypography>

                {/* Arrow */}
                <ArrowIcon
                  className="subpage-arrow"
                  sx={{
                    fontSize: 14,
                    color: 'text.secondary',
                    opacity: 0.4,
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                />
              </Box>

              {/* Menu Button */}
              {canEditPage() && (
                <IconButton
                  className="subpage-menu"
                  size="small"
                  onClick={(e) => handleMenuOpen(e, child)}
                  sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    ml: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    }
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              py: 1,
              px: 2
            }
          }
        }}
      >
        <MenuItem onClick={handleOpenPage}>
          <ListItemIcon>
            <PageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenInNewTab}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open in new tab</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleEditPage}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Subpage Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle>
          <MDTypography variant="h5" fontWeight="medium">
            Create Subpage
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          <MDBox py={2}>
            <TextField
              autoFocus
              label="Page Title"
              type="text"
              fullWidth
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPageTitle.trim()) {
                  handleCreateSubpage();
                }
              }}
              margin="normal"
              variant="outlined"
              error={!!error}
              helperText={error}
            />
            <MDTypography variant="body2" color="text" mt={2}>
              This page will be created as a subpage of the current page.
            </MDTypography>
          </MDBox>
        </DialogContent>
        <DialogActions sx={{ padding: '8px 24px 16px' }}>
          <MDButton onClick={handleCloseModal}>
            Cancel
          </MDButton>
          <MDButton
            onClick={handleCreateSubpage}
            color="warning"
            variant="contained"
            disabled={!newPageTitle.trim() || isCreating}
            sx={{
              color: "#ffffff",
              "&.MuiButton-contained": {
                color: "#ffffff"
              }
            }}
          >
            {isCreating ? <CircularProgress size={24} color="inherit" /> : "Create"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle>
          <MDTypography variant="h6" fontWeight="medium">
            Delete Subpage
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          <MDTypography variant="body2" color="text">
            Are you sure you want to delete "{selectedSubpage?.title}"? This action cannot be undone.
          </MDTypography>
        </DialogContent>
        <DialogActions sx={{ padding: '8px 24px 16px' }}>
          <MDButton onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </MDButton>
          <MDButton
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            sx={{
              color: "#ffffff",
              "&.MuiButton-contained": {
                color: "#ffffff"
              }
            }}
          >
            {isDeleting ? <CircularProgress size={24} color="inherit" /> : "Delete"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubpagesSection;
