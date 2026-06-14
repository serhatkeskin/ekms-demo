import { useState, useEffect, useMemo, ReactNode } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox/MDBox";
import SidenavComponent from "examples/Sidenav";

const Sidenav: any = SidenavComponent;
import Configurator from "examples/Configurator";
import theme from "assets/theme";
import themeDark from "assets/theme-dark";
import { getCombinedRoutes, filterRoutesByPermission, isDevelopment } from "routesConfig";
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "contexts/muiContext";
import { useAuth } from "contexts/auth/AuthContext";
import { NotificationProvider } from "contexts/notifications/NotificationContext";
import { UIProvider } from "contexts/ui/UIContext";
import DevModeBanner from "components/DevModeBanner";
import LoadingPopupv2 from "components/PopUp/LoadingPopupv2";

interface RouteConfig {
  route?: string;
  component?: ReactNode;
  key?: string;
  collapse?: RouteConfig[];
}

export default function App() {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor, transparentSidenav, whiteSidenav, darkMode } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [auth] = useAuth();
  const { isAuthenticated, user, loading } = auth;
  const isStaff = user?.is_staff || false;

  useEffect(() => {
    const publicRoutes = ['/authentication/sign-in', '/authentication/sign-up', '/oauth-callback'];
    if (!loading && !isAuthenticated && !publicRoutes.includes(pathname)) {
      navigate("/authentication/sign-in", { state: { from: pathname } });
    }
  }, [isAuthenticated, pathname, navigate, loading]);

  const routes = useMemo(() => {
    const combinedRoutes = getCombinedRoutes();
    return filterRoutesByPermission(combinedRoutes, isAuthenticated, isStaff);
  }, [isAuthenticated, isStaff]);

  const handleOnMouseEnter = () => { if (miniSidenav && !onMouseEnter) { setMiniSidenav(dispatch, false); setOnMouseEnter(true); } };
  const handleOnMouseLeave = () => { if (onMouseEnter) { setMiniSidenav(dispatch, true); setOnMouseEnter(false); } };
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  useEffect(() => { document.body.setAttribute("dir", direction); }, [direction]);
  useEffect(() => { document.documentElement.scrollTop = 0; if (document.scrollingElement) document.scrollingElement.scrollTop = 0; }, [pathname]);

  const getRoutes = (allRoutes: RouteConfig[]): ReactNode[] => {
    return allRoutes.flatMap((route, index) => {
      if (route.collapse) return getRoutes(route.collapse);
      if (route.route) return <Route path={route.route} element={route.component} key={route.key || `route-${route.route}-${index}`} />;
      return null;
    }).filter(Boolean) as ReactNode[];
  };

  const configsButton = (
    <MDBox display="flex" justifyContent="center" alignItems="center" width="3.25rem" height="3.25rem"
      bgColor="white" shadow="sm" borderRadius="50%" position="fixed" right="2rem" bottom="2rem"
      zIndex={99} color="dark" sx={{ cursor: "pointer" }} onClick={handleConfiguratorOpen}>
      <Icon fontSize="small" color="inherit">settings</Icon>
    </MDBox>
  );

  const getDefaultRedirect = () => !isAuthenticated ? <Navigate to="/authentication/sign-in" /> : <Navigate to="/dashboard/project" />;

  return (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      <NotificationProvider>
        <UIProvider>
          {loading && <LoadingPopupv2 />}
          {isDevelopment && <DevModeBanner />}
          {layout === "project_dashboard" && (
            <>
              <Sidenav color={sidenavColor} brand=""
                brandName="EKMS" routes={routes} onMouseEnter={handleOnMouseEnter} onMouseLeave={handleOnMouseLeave} />
              <Configurator />
              {configsButton}
            </>
          )}
          {layout === "vr" && <Configurator />}
          <Routes>
            {getRoutes(routes)}
            <Route path="/" element={getDefaultRedirect()} />
            <Route path="*" element={
              loading ||
              pathname.startsWith('/pages') || pathname.startsWith('/profile') ||
              pathname.startsWith('/search') || pathname.startsWith('/dashboard/') ? null : getDefaultRedirect()
            } />
          </Routes>
        </UIProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
