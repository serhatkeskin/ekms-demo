import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Icon,
  Autocomplete,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';

import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  DescriptionOutlined as PageIcon,
  DeleteOutline as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  ViewList as ListViewIcon,
  ViewModule as CardViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

// Page components
import PagesListView from './components/PagesListView';
import PageCardView from './components/PageCardView';

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';
import MDAlert from 'components/MDAlert/MDAlert';
import MDInput from 'components/MDInput/MDInput';
import MDPagination from 'components/MDPagination/MDPagination';

// EKMS React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar/DashboardNavbar";
import Footer from "examples/Footer";

// Import API service
import pageApi from 'services/pageApi';
import projectApi from 'services/projectApi';

import { PAGE_STATUS } from 'constants/Constants';
import StatusBadge from 'components/StatusBadge/StatusBadge';

function PagesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectParam = queryParams.get('project');
  const parentParam = queryParams.get('parent');
  const searchParam = queryParams.get('search');
  
  // State variables
  const [pages, setPages] = useState<any>([]);
  const [projects, setProjects] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState(projectParam || 'allProjects');
  const [menuAnchorEl, setMenuAnchorEl] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [newPageDialog, setNewPageDialog] = useState(false);
  const [showListView, setShowListView] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [newPageData, setNewPageData] = useState({
    title: '',
    project: '',
    parent: '',
    status: PAGE_STATUS.DRAFT
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const entriesOptions = ["5", "10", "15", "20", "25"];

  const [editPageDialog, setEditPageDialog] = useState(false);
  const [editPageData, setEditPageData] = useState({
    slug: '',
    title: '',
    project: '',
    parent: '',
    status: PAGE_STATUS.DRAFT
  });

  // No need for getProjectName as we use project details directly from page response

  // Handle search input change with debouncing
  const handleSearchChange = (event) => {
    const newQuery = event.target.value;
    setSearchQuery(newQuery);
    setCurrentPage(1); // Reset to first page when searching
    
    // Update URL params
    const newUrl = new URL(window.location.href);
    if (newQuery.trim()) {
      newUrl.searchParams.set('search', newQuery);
    } else {
      newUrl.searchParams.delete('search');
    }
    window.history.pushState({}, '', newUrl);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    
    // Update URL params
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('search');
    window.history.pushState({}, '', newUrl);
  };
  
  // Fetch initial data - projects and pages
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch projects
        const projectsData = await projectApi.getAllProjects();
        const projectsList = projectsData.content.data.results;
        setProjects(projectsList);
        
        // Initialize the project field in the new page form using slug
        setNewPageData(prev => ({
          ...prev,
          project: projectParam || (projectsList.length > 0 ? projectsList[0].slug : '')
        }));
        
        // Fetch pages with pagination parameters
        fetchPages();
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch pages function
  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let apiQueryParams: any = {
        page: currentPage,
        size: pageSize
      };
      
      // Add search parameter if there's a search query
      if (searchQuery.trim()) {
        apiQueryParams.search = searchQuery.trim();
      }
      
      // Handle the different view options
      if (selectedProject === 'allProjects') {
        apiQueryParams.parent = 'root';
      } else if (selectedProject === 'allPages') {
        // No parent filter needed
      } else {
        apiQueryParams.project = selectedProject;
        apiQueryParams.parent = parentParam || 'root';
      }
      
      const pagesData = await pageApi.getPages(apiQueryParams);
      
      if (pagesData && pagesData.content && pagesData.content.data) {
        const fetchedPages = pagesData.content.data.results;
        setPages(fetchedPages);
        setTotalCount(pagesData.content.data.count);
        setTotalPages(Math.ceil(pagesData.content.data.count / pageSize));
      } else {
        console.error("Unexpected API response format:", pagesData);
        setPages([]);
        setTotalCount(0);
        setTotalPages(1);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again later.');
      setLoading(false);
    }
  };

  // Effect to refetch pages when filters, pagination, or search changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPages();
    }, searchQuery.trim() ? 500 : 0); // Debounce search by 500ms, immediate for other changes
    
    return () => clearTimeout(debounceTimer);
  }, [selectedProject, parentParam, currentPage, pageSize, searchQuery]);

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  // Handle menu events
  const handleMenuOpen = (event, page) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPage(page);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPage(null);
  };

  // Handle page click to navigate to the page
  const handlePageClick = (page) => {
    navigate(`/pages/${page.slug}`);
  };

  // Handle creating a new page
  const handleCreatePage = async () => {
    try {
      setLoading(true);
      
      // Send the request to create a new page
      const response = await pageApi.createPage({
        title: newPageData.title,
        project: newPageData.project,
        parent: newPageData.parent || null,
        status: newPageData.status,
        properties: {}
      });
      
      // Close the dialog and reset form
      setNewPageDialog(false);
      setNewPageData({
        title: '',
        project: selectedProject !== 'allProjects' && selectedProject !== 'allPages' ? 
          selectedProject : (projects.length > 0 ? projects[0].slug : ''),
        parent: '',
        status: PAGE_STATUS.DRAFT
      });
      
      const newPage = response.content?.data || response.content || response;
        
      if (newPage && newPage.slug) {
        navigate(`/pages/${newPage.slug}`);
      } else {
        setError('Page created but navigation failed.');
        fetchPages(); // Refresh the page list
      }
      
    } catch (err) {
      console.error('Error creating page:', err);
      setError('Failed to create page. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a page
  const handleDeletePage = (page) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Page',
      message: `Are you sure you want to delete "${page.title}"? This action cannot be undone.`,
      action: async () => {
        try {
          setLoading(true);
          await pageApi.deletePage(page.slug);
          fetchPages(); // Refresh the pages list
          setLoading(false);
        } catch (err) {
          console.error('Error deleting page:', err);
          setError('Failed to delete page. Please try again later.');
          setLoading(false);
        }
      }
    });
    
    handleMenuClose();
  };

  // Handle cloning a page
  const handleClonePage = async (page) => {
    try {
      setLoading(true);
      const clonedPage = await pageApi.clonePage(page.slug);
      navigate(`/pages/${clonedPage.slug}`);
    } catch (err) {
      console.error('Error cloning page:', err);
      setError('Failed to clone page. Please try again later.');
    } finally {
      setLoading(false);
    }
    
    handleMenuClose();
  };

  // Handle project change
  const handleProjectChange = (event) => {
    const newProjectValue = event.target.value;
    setSelectedProject(newProjectValue);
    setCurrentPage(1); // Reset to first page when changing project
    
    // Update URL params
    const newUrl = new URL(window.location.href);
    
    if (newProjectValue === 'allProjects' || newProjectValue === 'allPages') {
      newUrl.searchParams.delete('project');
    } else {
      newUrl.searchParams.set('project', newProjectValue);
    }
    
    window.history.pushState({}, '', newUrl);
  };
  
  // Handle dialog fields change
  const handleNewPageDataChange = (event) => {
    const { name, value } = event.target;
    setNewPageData({
      ...newPageData,
      [name]: value
    });
  };

  const handleEditPageDataChange = (event) => {
  const { name, value } = event.target;
    setEditPageData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleUpdatePage = async () => {
    try {
      setLoading(true);
      await pageApi.updatePage(editPageData.slug, {
        title: editPageData.title,
        project: editPageData.project,
        parent: editPageData.parent || null,
        status: editPageData.status
      });
      setEditPageDialog(false);
      fetchPages(); // Refresh the page list
    } catch (err) {
      console.error("Error updating page:", err);
      setError("Failed to update page. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog confirmation
  const handleConfirmAction = () => {
    if (confirmDialog.action) {
      confirmDialog.action();
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };
  
  // Get view type label
  const getViewTypeLabel = () => {
    if (selectedProject === 'allProjects') {
      return 'All Root Pages';
    } else if (selectedProject === 'allPages') {
      return 'All Pages (Including Subpages)';
    } else {
      const selectedProjectObj = projects.find(p => p.slug === selectedProject);
      return `Project: ${selectedProjectObj ? selectedProjectObj.name : selectedProject}`;
    }
  };
  
  const getStatusBadge = (status) => <StatusBadge status={status} />;


  // Render list view - using the extracted PagesListView component
  const renderListView = () => (
    <PagesListView
      pages={pages}
      handlePageClick={handlePageClick}
      handleMenuOpen={handleMenuOpen}
      selectedProject={selectedProject}
      getStatusBadge={getStatusBadge}
      searchQuery={searchQuery}
      projects={projects}
    />
  );

  // Render card view - using the extracted PageCardView component
  const renderCardView = () => (
    <PageCardView
      pages={pages}
      handlePageClick={handlePageClick}
      handleMenuOpen={handleMenuOpen}
      selectedProject={selectedProject}
      getStatusBadge={getStatusBadge}
      projects={projects}
    />
  );

  // Render pagination elements
  const renderPagination = () => {
    const pageOptions = Array.from({ length: totalPages }, (_, index) => index);
    
    // Determine which pages to show (show at most 5 pages to avoid clutter)
    let pagesToRender;
    if (totalPages <= 5) {
      // Show all pages if there are 5 or fewer
      pagesToRender = pageOptions;
    } else {
      // Show a window of 5 pages centered around the current page
      const currentPageIndex = currentPage - 1;
      const start = Math.max(0, Math.min(currentPageIndex - 2, totalPages - 5));
      pagesToRender = pageOptions.slice(start, start + 5);
    }
    
    return pagesToRender.map((option) => (
      <MDPagination
        item
        key={option}
        onClick={() => handlePageChange(option + 1)}
        active={currentPage - 1 === option}
      >
        {option + 1}
      </MDPagination>
    ));
  };

  // Calculate entries display values
  const entriesStart = (currentPage - 1) * pageSize + 1;
  const entriesEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      
      <MDBox p={3}>
        {/* Header with actions */}
        <MDBox 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <MDTypography variant="h4" gutterBottom>
            Pages
          </MDTypography>
          
          <MDBox display="flex" gap={2} alignItems="center" flexWrap="wrap">
            {/* View Toggle */}
            <MDBox display="flex" alignItems="center" gap={1}>
              <CardViewIcon color={!showListView ? "warning" : "disabled"} />
              <FormControlLabel
                control={
                  <Switch
                    checked={showListView}
                    onChange={(e) => setShowListView(e.target.checked)}
                    color="warning"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
              <ListViewIcon color={showListView ? "warning" : "disabled"} />
            </MDBox>
            
            {/* Project/View selector */}
            {projects.length > 0 && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="project-selector-label">View</InputLabel>
                <Select
                  labelId="project-selector-label"
                  id="project-selector"
                  value={selectedProject}
                  onChange={handleProjectChange}
                  label="View"
                  sx={{ height: '50px' }}
                >
                  <MenuItem value="allProjects">All Root Pages</MenuItem>
                  <MenuItem value="allPages">All Pages (Including Subpages)</MenuItem>
                  <MenuItem disabled sx={{ opacity: 0.6 }}>
                    ────────────────
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.slug} value={project.slug}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {/* Create new page button */}
            <MDButton
              color="warning"
              variant="gradient"
              onClick={() => {
                setNewPageData({
                  ...newPageData,
                  project: selectedProject !== 'allProjects' && selectedProject !== 'allPages' ? 
                    selectedProject : (projects.length > 0 ? projects[0].slug : '')
                });
                setNewPageDialog(true);
              }}
              startIcon={<AddIcon />}
              disabled={projects.length === 0}
            >
              New Page
            </MDButton>
          </MDBox>
        </MDBox>
        
        {/* Search and Current view indicator */}
        <MDBox mb={3} display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} alignItems={{ xs: "stretch", sm: "center" }}>
          {/* Search Input */}
          <MDBox flex={1} maxWidth={{ xs: "100%", sm: "400px" }}>
            <TextField
              fullWidth
              placeholder="Search pages by title, project, author, or status..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      aria-label="clear search"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'warning.main',
                    },
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'warning.main',
                    },
                  },
                },
              }}
            />
          </MDBox>
          
          {/* Current view indicator */}
          <Chip 
            label={getViewTypeLabel()}
            color="warning"
            variant="outlined"
          />
        </MDBox>
        
        {/* Search Results Indicator */}
        {searchQuery.trim() && (
          <MDBox mb={2}>
            <MDAlert color="info" dismissible>
              <MDTypography variant="body2">
                {totalCount > 0 ? (
                  <>
                    Found {totalCount} page{totalCount !== 1 ? 's' : ''} matching "{searchQuery}"
                  </>
                ) : (
                  <>No pages found matching "{searchQuery}"</>
                )}
              </MDTypography>
            </MDAlert>
          </MDBox>
        )}
        
        {/* Error alert */}
        {error && (
          <MDAlert color="error" dismissible>
            {error}
          </MDAlert>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <MDBox display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </MDBox>
        )}
        
        {/* Empty state */}
        {!loading && pages.length === 0 && !searchQuery.trim() && (
          <Card>
            <MDBox p={6} textAlign="center">
              <MDTypography variant="h5" color="text" gutterBottom>
                No pages found
              </MDTypography>
              <MDTypography variant="body2" color="text">
                {selectedProject === 'allPages' || selectedProject === 'allProjects'
                  ? "No pages exist yet. Create your first page to get started."
                  : "This project doesn't have any pages yet."}
              </MDTypography>
              <MDButton 
                color="warning" 
                variant="gradient" 
                onClick={() => {
                  setNewPageData({
                    ...newPageData,
                    project: selectedProject !== 'allProjects' && selectedProject !== 'allPages' ? 
                      selectedProject : (projects.length > 0 ? projects[0].slug : '')
                  });
                  setNewPageDialog(true);
                }}
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
                disabled={projects.length === 0}
              >
                Create Page
              </MDButton>
            </MDBox>
          </Card>
        )}
        
        {/* No search results */}
        {!loading && pages.length === 0 && searchQuery.trim() && (
          <Card>
            <MDBox p={6} textAlign="center">
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <MDTypography variant="h5" color="text" gutterBottom>
                No search results
              </MDTypography>
              <MDTypography variant="body2" color="text" mb={2}>
                No pages found matching "{searchQuery}". Try adjusting your search terms or clearing the search to see all pages.
              </MDTypography>
              <MDButton 
                color="warning" 
                variant="outlined"
                onClick={handleClearSearch}
              >
                Clear Search
              </MDButton>
            </MDBox>
          </Card>
        )}
        
        {/* Pages content */}
        {!loading && pages.length > 0 && (
          <>
            {/* Page size selector and entries display */}
            <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
              <MDBox display="flex" alignItems="center">
                <Autocomplete
                  disableClearable
                  value={pageSize.toString()}
                  options={entriesOptions}
                  onChange={(event, newValue) => {
                    handlePageSizeChange(parseInt(newValue, 10));
                  }}
                  size="small"
                  sx={{ width: "5rem" }}
                  renderInput={(params) => <MDInput {...params} />}
                />
                <MDTypography variant="caption" color="secondary">
                  &nbsp;&nbsp;entries per page
                </MDTypography>
              </MDBox>
            </MDBox>

            {/* Conditional rendering based on view toggle */}
            {showListView && renderListView()}
          
            {/* Card view - render using the PageCardView component when not in list view */}
            {true && renderCardView()}
            
            {/* Pagination controls */}
            <MDBox
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              p={3}
            >
              <MDBox mb={{ xs: 3, sm: 0 }}>
                <MDTypography variant="button" color="secondary" fontWeight="regular">
                  Showing {entriesStart} to {entriesEnd} of {totalCount} entries
                  {searchQuery.trim() && ` (filtered)`}
                </MDTypography>
              </MDBox>
              
              {totalPages > 1 && (
                <MDPagination
                  variant="gradient"
                  color="warning"
                >
                  {currentPage > 1 && (
                    <MDPagination item onClick={() => handlePageChange(currentPage - 1)}>
                      <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
                    </MDPagination>
                  )}
                  
                  {totalPages > 6 ? (
                    <>
                      {renderPagination()}
                      <MDBox width="5rem" mx={1}>
                        <MDInput
                          inputProps={{ 
                            type: "number", 
                            min: 1, 
                            max: totalPages
                          }}
                          value={currentPage}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value) && value >= 1 && value <= totalPages) {
                              handlePageChange(value);
                            }
                          }}
                        />
                      </MDBox>
                    </>
                  ) : (
                    renderPagination()
                  )}
                  
                  {currentPage < totalPages && (
                    <MDPagination item onClick={() => handlePageChange(currentPage + 1)}>
                      <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
                    </MDPagination>
                  )}
                </MDPagination>
              )}
            </MDBox>
          </>
        )}
      </MDBox>
      
      {/* Page menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedPage) {
            setEditPageData({
              slug: selectedPage.slug,
              title: selectedPage.title,
              project: selectedPage.project,
              parent: selectedPage.parent || '',
              status: selectedPage.status
            });
            setEditPageDialog(true);
          }
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>

        <MenuItem onClick={() => handleClonePage(selectedPage)}>
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          Clone
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeletePage(selectedPage)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* New page dialog */}
      <Dialog 
        open={newPageDialog} 
        onClose={() => setNewPageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <MDTypography variant="h5" fontWeight="medium">
            Create New Page
          </MDTypography>
        </DialogTitle>
        <DialogContent>
          <MDBox py={2}>
            <TextField
              autoFocus
              name="title"
              label="Page Title"
              type="text"
              fullWidth
              value={newPageData.title}
              onChange={handleNewPageDataChange}
              margin="normal"
              variant="outlined"
              InputLabelProps={{ 
                shrink: true,
                style: { 
                  position: 'relative',
                  transform: 'none',
                  marginBottom: '8px',
                  fontSize: '1rem'
                }
              }}
              sx={{ 
                mb: 3,
                mt: 0,
                '& .MuiOutlinedInput-root': {
                  height: '56px'
                }
              }}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel 
                id="project-label"
                shrink
                style={{ 
                  position: 'relative',
                  transform: 'none',
                  marginBottom: '8px',
                  fontSize: '1rem'
                }}
              >
                Project
              </InputLabel>
              <Select
                labelId="project-label"
                id="project"
                name="project"
                value={newPageData.project}
                onChange={handleNewPageDataChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Project' }}
                sx={{ height: '56px' }}
              >
                {projects.map((project) => (
                  <MenuItem key={project.slug} value={project.slug}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel 
                id="parent-label"
                shrink
                style={{ 
                  position: 'relative',
                  transform: 'none',
                  marginBottom: '8px',
                  fontSize: '1rem'
                }}
              >
                Parent Page (Optional)
              </InputLabel>
              <Select
                labelId="parent-label"
                id="parent"
                name="parent"
                value={newPageData.parent}
                onChange={handleNewPageDataChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Parent Page' }}
                sx={{ height: '56px' }}
              >
                <MenuItem value="">None (Root Page)</MenuItem>
                {pages.map((page) => (
                  <MenuItem key={page.id} value={page.id}>
                    {page.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel 
                id="status-label"
                shrink
                style={{ 
                  position: 'relative',
                  transform: 'none',
                  marginBottom: '8px',
                  fontSize: '1rem'
                }}
              >
                Status
              </InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={newPageData.status}
                onChange={handleNewPageDataChange}
                sx={{ height: '56px' }}
              >
                <MenuItem value={PAGE_STATUS.DRAFT}>Draft</MenuItem>
                <MenuItem value={PAGE_STATUS.PUBLIC}>Public</MenuItem>
                <MenuItem value={PAGE_STATUS.PRIVATE}>Private</MenuItem>
              </Select>
            </FormControl>
          </MDBox>
        </DialogContent>
        <DialogActions sx={{ padding: '8px 24px 16px' }}>
          <MDButton onClick={() => setNewPageDialog(false)}>
            Cancel
          </MDButton>
          <MDButton 
            onClick={handleCreatePage} 
            color="warning" 
            variant="contained"
            disabled={!newPageData.title || !newPageData.project}
            sx={{ color: "#ffffff" }}
          >
            Create
          </MDButton>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <MDTypography>{confirmDialog.message}</MDTypography>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </MDButton>
          <MDButton 
            onClick={handleConfirmAction} 
            color="primary" 
            autoFocus
          >
            Confirm
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Edit page dialog */}
      <Dialog
        open={editPageDialog}
        onClose={() => setEditPageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <MDTypography variant="h5" fontWeight="medium">
            Edit Page
          </MDTypography>
        </DialogTitle>

        <DialogContent>
          <MDBox py={2} display="flex" flexDirection="column" gap={3}>
            <TextField
              name="title"
              label="Page Title"
              fullWidth
              value={editPageData.title}
              onChange={handleEditPageDataChange}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel shrink>Project</InputLabel>
              <Select
                name="project"
                value={editPageData.project}
                onChange={handleEditPageDataChange}
                displayEmpty
              >
                {projects.map((project) => (
                  <MenuItem key={project.slug} value={project.slug}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>Parent Page (Optional)</InputLabel>
              <Select
                name="parent"
                value={editPageData.parent}
                onChange={handleEditPageDataChange}
                displayEmpty
              >
                <MenuItem value="">None (Root Page)</MenuItem>
                {pages.map((page) => (
                  <MenuItem key={page.id} value={page.id}>
                    {page.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel shrink>Status</InputLabel>
              <Select
                name="status"
                value={editPageData.status}
                onChange={handleEditPageDataChange}
              >
                <MenuItem value={PAGE_STATUS.DRAFT}>Draft</MenuItem>
                <MenuItem value={PAGE_STATUS.PUBLIC}>Public</MenuItem>
                <MenuItem value={PAGE_STATUS.PRIVATE}>Private</MenuItem>
              </Select>
            </FormControl>
          </MDBox>
        </DialogContent>

        <DialogActions sx={{ padding: '8px 24px 16px' }}>
          <MDButton onClick={() => setEditPageDialog(false)}>Cancel</MDButton>
          <MDButton
            onClick={handleUpdatePage}
            color="warning"
            variant="contained"
            sx={{ color: '#ffffff' }}
          >
            Save Changes
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default PagesList;