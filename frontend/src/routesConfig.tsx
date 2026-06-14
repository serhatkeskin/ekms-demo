// routesConfig.js - Handles combining main routes with test routes based on environment
import { allRoutes } from "./routes";
import testRoutes from "./testRoutes";

// Get environment from Vite's environment variables
const ENVIRONMENT = import.meta.env.MODE;
const CUSTOM_ENV = import.meta.env.VITE_CUSTOM_APP_ENV;
const isDevelopment = ENVIRONMENT === "development" || CUSTOM_ENV === "development";

// Combine routes based on environment
const getCombinedRoutes = () => {
  // Always return the main routes in production
  if (!isDevelopment) {
    return allRoutes;
  }

  // In development, append test routes
  console.log("Development environment detected - adding test routes");
  return [...allRoutes, ...testRoutes];
};

// Filter routes based on authentication and staff status
const filterRoutesByPermission = (routes, isAuthenticated, isStaff) => {
  return routes.filter(route => {
    // Always include routes that aren't shown in the sidebar
    if (route.type === "route") return true;
    
    // Skip title elements (they'll be filtered separately based on their children)
    if (route.type === "title") return true;
    
    // For auth routes (sign in/sign up), only show if not authenticated
    if ((route.key === "sign-in" || route.key === "sign-up") && isAuthenticated) return false;
    
    // For logout, only show if authenticated
    if (route.key === "logout" && !isAuthenticated) return false;
    
    // For staff-only routes, only show if user is staff
    if (route.staffOnly && !isStaff) return false;
    
    // For other protected routes, only show if authenticated
    if (route.component && route.component.type === "ProtectedRoute" && !isAuthenticated) return false;
    
    return true;
  });
};

export { getCombinedRoutes, filterRoutesByPermission, isDevelopment };
export default getCombinedRoutes;
