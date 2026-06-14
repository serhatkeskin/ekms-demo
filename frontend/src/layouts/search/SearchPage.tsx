import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';

// EKMS React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar/DashboardNavbar";
import Footer from "examples/Footer";

// Search components - we'll use SearchResults only
import SearchResults from "components/Search/SearchResults";

// API
import searchApi from "services/searchApi";

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState(initialType);
  const [searchResults, setSearchResults] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  
  // Define filter maps for search types
  const typeFilters = {
    all: ['page', 'block', 'project'],
    pages: ['page'],
    blocks: ['block'],
    projects: ['project']
  };

  // Effect to perform search when query or type changes
  useEffect(() => {
    // Only search if we have a query from the URL
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the appropriate type filters based on the selected tab
        const types = typeFilters[searchType] || typeFilters.all;

        const results = await searchApi.search(searchQuery, { types, limit: 50 });
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred during search. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchType !== 'all') params.set('type', searchType);
    
    navigate(`/search?${params.toString()}`, { replace: true });
  }, [searchQuery, searchType, navigate]);

  // Handle tab change for filtering results
  const handleTabChange = (event, newValue) => {
    setSearchType(newValue);
  };

  // Handle when a search result is clicked
  const handleResultClick = (result) => {
    // This function could include additional analytics or tracking
    console.log('Search result clicked:', result);
  };

  // Handle form submission in case the user types in the search box on this page
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('searchInput') as string;
    if (query && query.trim().length >= 2) {
      setSearchQuery(query);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <MDTypography variant="h4" fontWeight="medium">
                    Search Results
                  </MDTypography>
                  
                  {/* Simple search form for this page */}
                  <Box 
                    component="form" 
                    onSubmit={handleSearchSubmit}
                    sx={{ 
                      display: 'flex', 
                      width: '50%', 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="input"
                      name="searchInput"
                      placeholder="Search..."
                      defaultValue={searchQuery}
                      sx={{
                        flex: 1,
                        border: 'none',
                        padding: '8px 16px',
                        outline: 'none',
                        fontSize: '0.875rem'
                      }}
                    />
                    <Box 
                      component="button"
                      type="submit"
                      sx={{
                        border: 'none',
                        bgcolor: 'warning.main',
                        color: 'white',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Icon>search</Icon>
                    </Box>
                  </Box>
                </MDBox>
                
                {searchQuery && (
                  <MDBox mb={2}>
                    <MDTypography variant="body2" color="text">
                      Showing results for: <strong>&quot;{searchQuery}&quot;</strong>
                    </MDTypography>
                  </MDBox>
                )}
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={searchType}
                    onChange={handleTabChange}
                    aria-label="search result tabs"
                    textColor="inherit"
                    indicatorColor="secondary"
                  >
                    <Tab value="all" label="All" icon={<Icon>search</Icon>} iconPosition="start" />
                    <Tab value="pages" label="Pages" icon={<Icon>description</Icon>} iconPosition="start" />
                    <Tab value="blocks" label="Blocks" icon={<Icon>article</Icon>} iconPosition="start" />
                    <Tab value="projects" label="Projects" icon={<Icon>folder</Icon>} iconPosition="start" />
                  </Tabs>
                </Box>
                
                <MDBox mt={3}>
                  {error ? (
                    <MDBox p={2} textAlign="center">
                      <Icon color="error" sx={{ mb: 1, fontSize: 40 }}>error</Icon>
                      <MDTypography variant="body1" color="text">
                        {error}
                      </MDTypography>
                    </MDBox>
                  ) : isLoading ? (
                    <MDBox p={4} textAlign="center">
                      <CircularProgress color="warning" />
                      <MDTypography variant="body1" color="text" mt={2}>
                        Searching...
                      </MDTypography>
                    </MDBox>
                  ) : !searchQuery || searchQuery.trim().length < 2 ? (
                    <MDBox p={4} textAlign="center">
                      <Icon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }}>search</Icon>
                      <MDTypography variant="body1" color="text">
                        Enter at least 2 characters to search
                      </MDTypography>
                    </MDBox>
                  ) : searchResults.length === 0 ? (
                    <MDBox p={4} textAlign="center">
                      <Icon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }}>search_off</Icon>
                      <MDTypography variant="body1" color="text">
                        No results found for &quot;{searchQuery}&quot;
                      </MDTypography>
                    </MDBox>
                  ) : (
                    <SearchResults
                      results={searchResults}
                      loading={false}
                      searchQuery={searchQuery}
                      onResultClick={handleResultClick}
                    />
                  )}
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SearchPage;