// EKMS React layouts
import ProjectDashboard from "layouts/dashboard/ProjectDashboard";
import UserManagement from "layouts/dashboard/UserManagement";
// import Billing from "layouts/billing";
// import RTL from "layouts/rtl";
import Profile from "layouts/profile/Profile"; // This points to our updated Profile component
import SignIn from "layouts/authentication/sign-in/SignIn";
import SignUp from "layouts/authentication/sign-up/SignUp";
import Logout from "layouts/authentication/logout/Logout";
import SearchPage from "layouts/search/SearchPage"; // Import the Search Page
import Page from "layouts/page/Page";
import PagesList from "layouts/page/PagesList";

// @mui icons
import Icon from "@mui/material/Icon";
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search"; // Import Search icon

// Import the OAuthCallback component with correct path
import OAuthCallback from "layouts/authentication/components/oauthCallBack";

// Import ProtectedRoute component
import ProtectedRoute from "components/ProtectedRoute";
// Define all routes including staff-only routes
const allRoutes = [
  // Place the non-sidebar routes at the top to ensure they're matched first
  {
    type: "route", // Make it clear this is just a route, not a sidebar item
    path: "/oauth-callback",
    route: "/oauth-callback", // Add this to be consistent
    component: <OAuthCallback />,
  },
  {
    type: "route",
    path: "/logout",
    route: "/logout",
    component: <Logout />,
  },
  // Regular sidebar routes - now protected
  {
    type: "collapse",
    name: "Search",
    key: "search",
    icon: <SearchIcon fontSize="small" />,
    route: "/search",
    component: <ProtectedRoute><SearchPage /></ProtectedRoute>,
  },
  {
    type: "collapse",
    name: "User Management",
    key: "user-management",
    icon: <GroupIcon fontSize="small"></GroupIcon>,
    route: "/management/user",
    component: <ProtectedRoute><UserManagement /></ProtectedRoute>,
    staffOnly: true,
  },
  {
    type: "collapse",
    name: "Projects Dashboard",
    key: "dashboard project",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard/project",
    component: <ProtectedRoute><ProjectDashboard /></ProtectedRoute>,
  },
  {
    type: "collapse",
    name: "Pages",
    key: "pages",
    icon: <DescriptionIcon fontSize="small" />,
    route: "/pages",
    component: <ProtectedRoute><PagesList /></ProtectedRoute>,
  },
  {
    type: "collapse",
    name: "Profile",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/authentication/sign-up",
    component: <SignUp />,
  },
  {
    type: "collapse",
    name: "Logout",
    key: "logout",
    icon: <Icon fontSize="small">logout</Icon>,
    route: "/logout",
    component: <Logout />,
  },
  {
    type: "route", // This is a route not shown in the sidebar
    path: "/pages/:slug",
    route: "/pages/:slug",
    component: <ProtectedRoute><Page /></ProtectedRoute>,
  },
];

// Filter routes based on authentication and staff status
const filterRoutesByPermission = (routes, isAuthenticated, isStaff) => {
  return routes.filter(route => {
    // Always include routes that aren't shown in the sidebar
    if (route.type === "route") return true;
    
    // For auth routes (sign in/sign up), only show if not authenticated
    if ((route.key === "sign-in" || route.key === "sign-up") && isAuthenticated) return false;
    
    // For logout, only show if authenticated
    if (route.key === "logout" && !isAuthenticated) return false;
    
    // For staff-only routes, only show if user is staff
    if (route.staffOnly && !isStaff) return false;
    
    // For other protected routes, only show if authenticated
    if (route.component && route.component.type === ProtectedRoute && !isAuthenticated) return false;
    
    return true;
  });
};

export { allRoutes, filterRoutesByPermission };
export default allRoutes;