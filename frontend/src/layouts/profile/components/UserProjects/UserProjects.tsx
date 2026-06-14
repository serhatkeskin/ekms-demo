import { useMemo, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Tooltip from "@mui/material/Tooltip";

// API configuration
import { API_BASE } from "services/base";

// Images
import ekms_logo from "assets/images/ekms_logo.svg";
import default_avatar from "assets/images/default_avatar.jpg";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDPagination from 'components/MDPagination/MDPagination';
import MDButton from 'components/MDButton/MDButton';

function UserProjects({ projects, currentPage, projectsPerPage, setCurrentPage, totalPages }: any) {
  // Handle pagination navigation
  const gotoPage = useCallback((pageIndex) => {
    setCurrentPage(pageIndex);
  }, [setCurrentPage]);
  
  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages, setCurrentPage]);
  
  const previousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage, setCurrentPage]);

  // Generate pagination components
  const renderPagination = useMemo(() => {
    const pageOptions = Array.from({ length: totalPages }, (_, i) => i);
    
    return pageOptions.map((option) => (
      <MDPagination
        item
        key={option}
        onClick={() => gotoPage(Number(option))}
        active={currentPage === option}
      >
        {option + 1}
      </MDPagination>
    ));
  }, [totalPages, currentPage, gotoPage]);

  // Get current page of projects
  const currentProjects = useMemo(() => {
    const startIdx = currentPage * projectsPerPage;
    const endIdx = startIdx + projectsPerPage;
    return projects.slice(startIdx, endIdx);
  }, [projects, currentPage, projectsPerPage]);

  // Handle project navigation
  const handleProjectClick = useCallback((projectSlug) => {
    window.location.href = `/pages/?project=${projectSlug}&parent=root`;
  }, []);

  // Render project cards with consistent sizing
  const renderedProjects = useMemo(() => {
    // If we have user projects, render the current page
    if (currentProjects && currentProjects.length > 0) {
      return currentProjects.map((project, index) => {
        // Prepare authors array for the project card
        let authors = [];
        
        if (project.memberships && Array.isArray(project.memberships)) {
          authors = project.memberships.slice(0, 4).map((membership, i) => {
            const memberUser = membership.user;
            if (!memberUser) {
              return { 
                image: default_avatar,
                name: `Unknown Member`,
                username: 'unknown'
              };
            }
            
            // Get user name
            const userName = memberUser.first_name || memberUser.last_name 
              ? `${memberUser.first_name || ''} ${memberUser.last_name || ''}`.trim()
              : memberUser.username || `Member`;
            
            // Handle avatar - ensure it's a string, not an object
            let avatarImage = default_avatar;
            
            if (memberUser.avatar) {
              // Check if it's a full URL
              if (typeof memberUser.avatar === 'string') {
                if (memberUser.avatar.startsWith("http://") || memberUser.avatar.startsWith("https://")) {
                  avatarImage = memberUser.avatar;
                } else {
                  avatarImage = `${API_BASE}${memberUser.avatar}`;
                }
              }
            }
            
            return {
              image: avatarImage,
              name: userName,
              username: memberUser.username || 'unknown'
            };
          });
        }

        // Handle project logo with fallback
        const projectImage = project.project_logo && typeof project.project_logo === 'string' 
          ? project.project_logo 
          : ekms_logo;

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={project.id || index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                },
                borderRadius: '12px',
                overflow: 'hidden'
              }}
              onClick={() => handleProjectClick(project.project_slug)}
            >
              {/* Fixed size image container */}
              <MDBox
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5'
                }}
              >
                <CardMedia
                  component="img"
                  image={projectImage}
                  alt={project.project_name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    objectFit: 'fill', // Fill the entire area and crop if necessary
                    objectPosition: 'center', // Center the image
                    backgroundColor: '#f5f5f5',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)' // Slight zoom on hover
                    }
                  }}
                  onError={(e: any) => {
                    e.target.src = ekms_logo;
                  }}
                />
                

              </MDBox>

              {/* Card content with fixed height */}
              <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
                <MDBox mb={1}>
                  <MDTypography 
                    variant="h6" 
                    fontWeight="medium"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '3rem', // Ensures consistent height
                      lineHeight: 1.5
                    }}
                  >
                    {project.project_name}
                  </MDTypography>
                </MDBox>

                {/* Project description */}
                {project.description && (
                  <MDBox mb={2}>
                    <MDTypography 
                      variant="body2" 
                      color="text"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '2.5rem',
                        lineHeight: 1.4
                      }}
                    >
                      {project.description}
                    </MDTypography>
                  </MDBox>
                )}

                {/* Authors section */}
                {/* <MDBox 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  mt="auto"
                >
                  <MDBox display="flex" alignItems="center">
                    {authors.length > 0 ? (
                      <AvatarGroup 
                        max={4}
                        sx={{
                          '& .MuiAvatar-root': {
                            width: 28,
                            height: 28,
                            fontSize: '0.75rem',
                            border: '2px solid white'
                          }
                        }}
                      >
                        {authors.map((author, i) => (
                          <Tooltip 
                            key={i} 
                            title={author.name}
                            placement="top"
                          >
                            <Avatar
                              src={author.image}
                              alt={author.name}
                              sx={{
                                width: 28,
                                height: 28,
                                backgroundColor: '#f0f0f0'
                              }}
                            >
                              {author.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                    ) : (
                      <MDTypography variant="caption" color="text">
                        No members
                      </MDTypography>
                    )}
                  </MDBox>
                </MDBox> */}
              </CardContent>

              {/* Card actions */}
              <CardActions sx={{ p: 2, pt: 0 }}>
                <MDButton
                  variant="outlined"
                  color="warning"
                  size="small"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectClick(project.project_slug);
                  }}
                >
                  View Project
                </MDButton>
              </CardActions>
            </Card>
          </Grid>
        );
      });
    }
    
    // If no projects, show placeholder
    return (
      <Grid item xs={12}>
        <MDBox p={3} textAlign="center">
          <Icon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }}>
            folder_open
          </Icon>
          <MDTypography variant="h6" color="text.secondary" mb={1}>
            No Projects Found
          </MDTypography>
          <MDTypography variant="body2" color="text">
            You haven&apos;t been added to any projects yet.
          </MDTypography>
        </MDBox>
      </Grid>
    );
  }, [currentProjects, currentPage, projectsPerPage, handleProjectClick]);

  return (
    <>
      <MDBox pt={2} px={2} lineHeight={1.25}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h6" fontWeight="medium">
            Projects
          </MDTypography>
          <MDTypography variant="button" color="text">
            {projects.length > 0 ? `Showing ${currentPage * projectsPerPage + 1} to ${Math.min((currentPage + 1) * projectsPerPage, projects.length)} of ${projects.length} projects` : ''}
          </MDTypography>
        </MDBox>
        <MDBox mb={1}>
          <MDTypography variant="button" color="text">
            Projects that you are a member of
          </MDTypography>
        </MDBox>
      </MDBox>
      
      <MDBox p={2}>
        {/* Grid container with consistent spacing */}
        <Grid container spacing={3}>
          {renderedProjects}
        </Grid>
        
        {/* Pagination component */}
        {projects.length > projectsPerPage && (
          <MDBox 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            mt={4}
          >
            <MDPagination
              variant="gradient"
              color="warning"
            >
              {currentPage > 0 && (
                <MDPagination item onClick={previousPage}>
                  <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
                </MDPagination>
              )}
              
              {renderPagination}
              
              {currentPage < totalPages - 1 && (
                <MDPagination item onClick={nextPage}>
                  <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
                </MDPagination>
              )}
            </MDPagination>
          </MDBox>
        )}
      </MDBox>
    </>
  );
}

export default UserProjects;