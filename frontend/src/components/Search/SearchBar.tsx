import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// @mui material components
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import CircularProgress from '@mui/material/CircularProgress';
import Icon from '@mui/material/Icon';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

// EKMS React components
import MDBox from "components/MDBox/MDBox";

// Search Components
import SearchResults from 'components/Search/SearchResults';

// API
import searchApi from 'services/searchApi';

// Debounce function for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    // Skip debouncing for empty or very short queries to improve performance
    if (value.trim().length < 2) {
      setDebouncedValue(value);
      return;
    }
    
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchBar = ({ placeholder, fullWidth, projectId }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    types: ['page', 'block', 'project']
  });
  const [searchError, setSearchError] = useState(null);
  
  const anchorRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const navigate = useNavigate();
  const cmdKPressed = useRef(false);
  const initialFocusRef = useRef(false);
  
  // Use debounce to avoid making too many API calls while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setIsLoading(true);
        setSearchError(null);

        // Create search options object
        const searchOptions: any = {
          types: selectedFilters.types,
          limit: 20
        };

        // Add project ID filter if provided
        if (projectId) {
          searchOptions.project_id = projectId;
        }

        const results = await searchApi.search(debouncedSearchQuery, searchOptions);
        setSearchResults(results as any);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('An error occurred while searching');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, selectedFilters, projectId]);

  // Focus handler
  const handleFocus = () => {
    setIsSearchFocused(true);
  };

  // Click away handler
  const handleClickAway = () => {
    setIsSearchFocused(false);
  };

  // Input change handler
  const handleInputChange = (event) => {
    // If it's the initial focus caused by Cmd+K and the value is 'k', ignore it
    if (cmdKPressed.current && event.target.value.toLowerCase() === 'k') {
      cmdKPressed.current = false;
      return;
    }
    
    setSearchQuery(event.target.value);
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    
    // Focus the input again after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Toggle filter type
  const handleToggleFilter = (type) => {
    setSelectedFilters(prev => {
      const types = [...prev.types];
      
      // Check if type is already in the filters
      const typeIndex = types.indexOf(type);
      
      // If it's in the filters, remove it
      if (typeIndex !== -1) {
        types.splice(typeIndex, 1);
      } else {
        // Otherwise add it
        types.push(type);
      }
      
      return { ...prev, types };
    });
  };

  // Handle search result click
  const handleResultClick = () => {
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  // Focus when the input ref changes
  useEffect(() => {
    if (initialFocusRef.current && inputRef.current) {
      inputRef.current.focus();
      initialFocusRef.current = false;
    }
  }, [inputRef.current]);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd+K or Ctrl+K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        
        // Set the flag to ignore the 'k' character
        cmdKPressed.current = true;
        
        // Clear any existing search query
        setSearchQuery('');
        
        // Set the search as focused
        setIsSearchFocused(true);
        
        // Focus the input element directly
        if (inputRef.current) {
          inputRef.current.focus();
          
          // This helps ensure focus is actually given to the element
          initialFocusRef.current = true;
          
          // Programmatically click the input to ensure it receives focus
          inputRef.current.click();
        }
      }
      
      // Escape to close search results
      if (event.key === 'Escape' && isSearchFocused) {
        setIsSearchFocused(false);
      }
    };

    const handleKeyUp = (event) => {
      // Reset the flag when Cmd/Ctrl key is released
      if (event.key === 'Meta' || event.key === 'Control') {
        cmdKPressed.current = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSearchFocused]);

  // Handle form submission to prevent default behavior
  const handleFormSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div>
        <Paper
          ref={anchorRef}
          component="form"
          onSubmit={handleFormSubmit}
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: fullWidth ? '100%' : 260,
            borderRadius: 2,
            boxShadow: isSearchFocused ? 3 : 1,
            transition: 'box-shadow 0.3s ease',
            borderColor: theme => isSearchFocused ? theme.palette.primary.main : 'transparent',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          elevation={isSearchFocused ? 3 : 1}
        >
          <IconButton sx={{ p: '10px' }} aria-label="search">
            {isLoading ? (
              <CircularProgress size={20} color="warning" />
            ) : (
              <Icon>search</Icon>
            )}
          </IconButton>
          <InputBase
            ref={inputRef}
            sx={{ 
              ml: 1, 
              flex: 1, 
              '& .MuiInputBase-input::placeholder': {
                fontSize: '0.875rem', // Makes the placeholder text smaller
                color: 'text.secondary', // Optional: makes the placeholder text slightly muted
                opacity: 0.7 // Optional: reduces the opacity slightly
              }
            }}
            placeholder={placeholder}
            inputProps={{ 
              'aria-label': placeholder,
              autoFocus: isSearchFocused
            }}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
          />
          {searchQuery && (
            <IconButton 
              sx={{ p: '10px' }} 
              aria-label="clear search" 
              onClick={handleClearSearch}
            >
              <Icon>clear</Icon>
            </IconButton>
          )}
          <Tooltip title="Press Ctrl+K to search">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                ml: 1,
                mr: 0.5,
                bgcolor: 'action.selected',
                borderRadius: 1,
                fontSize: '0.75rem',
                opacity: 0.7
              }}
            >
              ⌘K
            </Box>
          </Tooltip>
        </Paper>
        
        <Popper
          open={isSearchFocused && (!!searchQuery || searchQuery === '')}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          transition
          disablePortal
          style={{ 
            width: fullWidth ? anchorRef.current?.offsetWidth : 400,
            zIndex: 1300,
            marginTop: '4px'
          }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper 
                elevation={5} 
                sx={{ 
                  borderRadius: 2,
                  maxHeight: '70vh',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Search Filters */}
                <MDBox 
                  p={1} 
                  display="flex" 
                  flexDirection="row" 
                  alignItems="center" 
                  flexWrap="wrap"
                  gap={1}
                  borderBottom="1px solid"
                  borderColor="divider"
                >
                  <Chip
                    label="Pages"
                    size="small"
                    color={selectedFilters.types.includes('page') ? "warning" : "default"}
                    onClick={() => handleToggleFilter('page')}
                    icon={<Icon fontSize="small">description</Icon>}
                  />
                  <Chip
                    label="Blocks"
                    size="small" 
                    color={selectedFilters.types.includes('block') ? "warning" : "default"}
                    onClick={() => handleToggleFilter('block')}
                    icon={<Icon fontSize="small">article</Icon>}
                  />
                  <Chip
                    label="Projects"
                    size="small"
                    color={selectedFilters.types.includes('project') ? "warning" : "default"}
                    onClick={() => handleToggleFilter('project')}
                    icon={<Icon fontSize="small">folder</Icon>}
                  />
                </MDBox>
                
                {/* Search Results */}
                {searchError ? (
                  <MDBox p={2} textAlign="center">
                    <Icon color="error" sx={{ mb: 1 }}>error</Icon>
                    <Box>{searchError}</Box>
                  </MDBox>
                ) : searchQuery.trim().length < 2 ? (
                  <MDBox p={2} textAlign="center" color="text.secondary">
                    Type at least 2 characters to search
                  </MDBox>
                ) : (
                  <SearchResults
                    results={searchResults}
                    loading={isLoading}
                    searchQuery={searchQuery}
                    onResultClick={handleResultClick}
                  />
                )}
              </Paper>
            </Fade>
          )}
        </Popper>
      </div>
    </ClickAwayListener>
  );
};

// Prop type validation
SearchBar.propTypes = {
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Default props
SearchBar.defaultProps = {
  placeholder: 'Search...',
  fullWidth: false,
  projectId: null
};

export default SearchBar;