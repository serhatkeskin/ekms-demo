import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";

// @mui material components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Import NotificationIcon component
import NotificationIcon from "components/Notifications/NotificationIcon";

// Import the Search component
import SearchBar from "components/Search/SearchBar";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// EKMS React context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "contexts/muiContext";

// Auth context
import { useAuth } from "contexts/auth/AuthContext";

function DashboardNavbar({ absolute, light, isMini, breadcrumbs }: any) {
  // console.log("DashboardNavbar component rendered with props:", { absolute, light, isMini, breadcrumbs });
  const [navbarType, setNavbarType] = useState<any>("sticky");
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;
  const [openMenu, setOpenMenu] = useState<any>(false);
  const location = useLocation(); // always called
  const route = breadcrumbs
    ? breadcrumbs.map(b => b.url)
    : location.pathname.split("/").filter(Boolean);
  // console.log("Current route:", route);
  
  // Extract project ID from query params if it exists in the URL
  // console.log("Current location:", location);
  const searchParams = new URLSearchParams(location.search);
  const currentProjectId = searchParams.get('project');

  // Get auth context
  const [auth, authActions] = useAuth();
  const { isAuthenticated, user } = auth;

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);
  
  const handleLogout = () => {
    authActions.logout();
  };

  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      {/* <NotificationItem icon={<Icon>account_circle</Icon>} title="Profile" />
      <NotificationItem icon={<Icon>settings</Icon>} title="Settings" /> */}
      <NotificationItem 
        icon={<Icon>logout</Icon>} 
        title="Logout" 
        onClick={handleLogout}
      />
    </Menu>
  );

  // Styles for the navbar icons
  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }: any) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }

      return colorValue;
    },
  });

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs
            icon="home"
            title={breadcrumbs ? breadcrumbs[breadcrumbs.length - 1]?.title : route[route.length - 1]}
            route={breadcrumbs || route}
            light={light}
          />
        </MDBox>
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            {/* Search Bar component - preserved as requested */}
            <MDBox pr={1} width={{ xs: '100%', md: 'auto' }}>
              <SearchBar 
                placeholder="Search pages, content..." 
                projectId={currentProjectId}
                fullWidth={false}
              />
            </MDBox>
            <MDBox color={light ? "white" : "inherit"} display="flex" alignItems="center">
              {isAuthenticated && (
                <>
                  {/* Notification Icon component */}
                  <NotificationIcon />
                
                  {/* User profile link */}
                  <Link to="/profile">
                    <IconButton 
                      sx={navbarIconButton} 
                      size="small" 
                      disableRipple
                    >
                      <Icon sx={iconsStyle}>account_circle</Icon>
                    </IconButton>
                  </Link>
                </>
              )}
              
              {/* Mobile menu toggle */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              
              {/* Settings button */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton>
              
              {/* User menu button */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                onClick={handleOpenMenu}
              >
                <Icon sx={iconsStyle}>more_vert</Icon>
              </IconButton>
              {renderMenu()}
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
  breadcrumbs: PropTypes.array, // Add this
};

DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
  breadcrumbs: null, // Add this
};

export default DashboardNavbar;