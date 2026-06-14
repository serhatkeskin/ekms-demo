import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// @mui material components
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Icon from '@mui/material/Icon';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';

// Helper function to create highlighted text with bold matches
const HighlightedText = ({ text, matchText }: any) => {
  if (!matchText || !text) return <span>{text}</span>;
  
  // Escape regex special characters in the match text
  const escapedMatchText = matchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create a regex that's case insensitive
  const regex = new RegExp(`(${escapedMatchText})`, 'gi');
  
  // Split the text by the regex matches
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, index) => 
        regex.test(part) ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>
      )}
    </span>
  );
};

// Determine the appropriate icon for each result type
const getResultIcon = (type) => {
  switch (type) {
    case 'page':
      return <Icon>description</Icon>;
    case 'block':
      return <Icon>article</Icon>;
    case 'project':
      return <Icon>folder</Icon>;
    default:
      return <Icon>search</Icon>;
  }
};

// Create a descriptive subtitle based on the result type and content
const getResultSubtitle = (result) => {
  switch (result.type) {
    case 'page':
      return result.project_title 
        ? `Project: ${result.project_title} • ${result.status || 'Draft'}`
        : result.status || 'Draft';
    case 'block':
      return `${result.page_title || 'Untitled Page'} • ${result.block_type || 'Block'}`;
    case 'project':
      return result.description || 'Project';
    default:
      return '';
  }
};

// Get the path for navigating to a search result
const getNavigationPath = (result) => {
  switch (result.type) {
    case 'page':
      return `/pages/${result.slug}`;
    case 'block':
      return `/pages/${result.page_slug}#${result.block_id}`;
    case 'project':
      return `/pages/?project=${result.id}`;
    default:
      return '/';
  }
};

const SearchResults = ({ results, loading, searchQuery, onResultClick }: any) => {
  const navigate = useNavigate();

  const handleResultClick = (result) => {
    // Call the optional callback if provided
    if (onResultClick) {
      onResultClick(result);
    }
    
    // Navigate to the appropriate location
    const path = getNavigationPath(result);
    navigate(path);
  };

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" p={3}>
        <CircularProgress color="warning" />
      </MDBox>
    );
  }

  if (!results || results.length === 0) {
    return (
      <MDBox p={2} textAlign="center">
        <MDTypography variant="body2" color="text">
          No results found for &quot;{searchQuery}&quot;
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: '60vh', overflow: 'auto' }}>
      {results.map((result, index) => (
        <React.Fragment key={`${result.type}-${result.id}`}>
          <ListItem disablePadding alignItems="flex-start">
            <ListItemButton onClick={() => handleResultClick(result)}>
              <ListItemIcon>
                {getResultIcon(result.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <HighlightedText 
                    text={result.title || result.content_preview || 'Untitled'} 
                    matchText={searchQuery}
                  />
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {getResultSubtitle(result)}
                    </Typography>
                    {result.content_preview && (
                      <Typography
                        component="p"
                        variant="body2"
                        color="text.secondary"
                        sx={{ 
                          mt: 0.5, 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        <HighlightedText 
                          text={result.content_preview} 
                          matchText={searchQuery}
                        />
                      </Typography>
                    )}
                  </React.Fragment>
                }
              />
            </ListItemButton>
          </ListItem>
          {index < results.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

// Prop type validation
SearchResults.propTypes = {
  results: PropTypes.array,
  loading: PropTypes.bool,
  searchQuery: PropTypes.string,
  onResultClick: PropTypes.func
};

// Default props
SearchResults.defaultProps = {
  results: [],
  loading: false,
  searchQuery: '',
  onResultClick: null
};

export default SearchResults;