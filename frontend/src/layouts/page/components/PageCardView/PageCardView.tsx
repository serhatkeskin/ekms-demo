import React from 'react';
import {
  Card,
  Grid,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  DescriptionOutlined as PageIcon
} from '@mui/icons-material';

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';

/**
 * PageCardView - A component for displaying pages in a card view format
 * 
 * @param {Object} props
 * @param {Array} props.pages - The array of pages to display
 * @param {Function} props.handlePageClick - Function to handle when a page is clicked
 * @param {Function} props.handleMenuOpen - Function to handle when the menu icon is clicked
 * @param {String} props.selectedProject - The currently selected project slug
 * @param {Function} props.getStatusBadge - Function to get the status badge for a page
 * @param {Array} props.projects - The array of all projects
 */
function PageCardView({ 
  pages, 
  handlePageClick, 
  handleMenuOpen, 
  selectedProject,
  getStatusBadge,
  projects
}) {
  return (
    <Grid container spacing={3}>
      {pages.map((page) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={page.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 6
              }
            }}
            onClick={() => handlePageClick(page)}
          >
            <MDBox 
              p={2}
              display="flex" 
              flexDirection="column"
              height="100%"
            >
              <MDBox 
                display="flex" 
                justifyContent="space-between" 
                alignItems="flex-start"
                mb={1}
              >
                <MDBox display="flex" alignItems="flex-start" sx={{ width: "calc(100% - 40px)" }}>
                  {page.icon ? (
                    <MDTypography variant="h6" sx={{ mr: 1 }}>
                      {page.icon}
                    </MDTypography>
                  ) : (
                    <PageIcon color="warning" sx={{ mt: 0.5, mr: 1 }} />
                  )}
                  <MDTypography 
                    variant="h6" 
                    fontWeight="medium" 
                    sx={{ 
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%"
                    }}
                  >
                    {page.title}
                  </MDTypography>
                </MDBox>
                
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(e, page);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </MDBox>
              
              <MDBox sx={{ flex: 1 }}>
                <MDTypography variant="body2" color="text">
                  {getStatusBadge(page.status)}
                </MDTypography>
                
                {/* Always show project name */}
                <MDBox mt={1}>
                  <MDTypography variant="caption" color="text">
                    Project: {projects.find(p => p.slug === page.project)?.name || page.project}
                  </MDTypography>
                </MDBox>
                
                {/* Show breadcrumb path when in all pages view */}
                {selectedProject === 'allPages' && page.parent && (
                  <MDBox mt={0.5}>
                    {page.breadcrumbs ? (
                      <MDTypography variant="caption" color="text">
                        Path: {page.breadcrumbs.map(crumb => crumb.title).join(' > ')}
                      </MDTypography>
                    ) : (
                      <MDTypography variant="caption" color="text">
                        Subpage
                      </MDTypography>
                    )}
                  </MDBox>
                )}
                
                {page.child_count > 0 && (
                  <MDBox mt={0.5}>
                    <MDTypography variant="caption" color="text">
                      {page.child_count} subpage{page.child_count !== 1 ? 's' : ''}
                    </MDTypography>
                  </MDBox>
                )}
              </MDBox>
              
              {page.created_by && (
                <MDBox mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <MDTypography variant="caption" color="text">
                    Author: {page.created_by.username || page.created_by}
                  </MDTypography>
                </MDBox>
              )}
              
              <MDBox mt={2} display="flex" justifyContent="space-between" alignItems="center">
                <MDTypography variant="caption" color="text">
                  Last updated: {new Date(page.updated_at).toLocaleDateString()}
                </MDTypography>
              </MDBox>
            </MDBox>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default PageCardView;
