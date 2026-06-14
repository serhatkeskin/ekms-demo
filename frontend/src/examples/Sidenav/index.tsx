import React, { useEffect, useMemo, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';

import SidenavCollapse from "examples/Sidenav/SidenavCollapse";
import SidenavRoot from "examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav";

import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
} from "contexts/muiContext";

import { useAuth } from "contexts/auth/AuthContext";

function Sidenav({ color, brand, brandName, routes, ...rest }: any) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } = controller;
  const location = useLocation();
  const collapseName = location.pathname.replace(/^\/|\/$/g, "").replace(/\//g, " ");

  const [expanded, setExpanded] = useState({});
  const [auth] = useAuth();
  const { isAuthenticated, user } = auth;
  const isStaff = user?.is_staff || false;

  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      if (route.type !== "collapse" && route.type !== "title") return false;
      if ((route.key === "sign-in" || route.key === "sign-up") && isAuthenticated) return false;
      if (route.key === "logout" && !isAuthenticated) return false;
      if (route.staffOnly && !isStaff) return false;
      return true;
    });
  }, [routes, isAuthenticated, isStaff]);

  useEffect(() => {
    const findAndExpandParent = (routes, path, expansionState = {}) => {
      for (const route of routes) {
        if (route.type !== 'collapse') continue;
        if (route.collapse) {
          const childRouteFound = route.collapse.some(child =>
            child.route === path ||
            (child.collapse && findAndExpandParent(child.collapse, path, {}))
          );
          if (childRouteFound) {
            expansionState[route.key] = true;
            return true;
          }
        }
        if (route.route === path) return true;
      }
      return false;
    };

    const newExpanded = {};
    findAndExpandParent(filteredRoutes, location.pathname, newExpanded);
    setExpanded(prev => ({ ...prev, ...newExpanded }));
  }, [location.pathname, filteredRoutes]);

  let textColor = "white";
  if (transparentSidenav || (whiteSidenav && !darkMode)) textColor = "dark";
  else if (whiteSidenav && darkMode) textColor = "inherit";

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    function handleMiniSidenav() {
      const isMobile = window.innerWidth < 1200;
      setMiniSidenav(dispatch, isMobile);
      setTransparentSidenav(dispatch, isMobile ? false : transparentSidenav);
      setWhiteSidenav(dispatch, isMobile ? false : whiteSidenav);
    }

    window.addEventListener("resize", handleMiniSidenav);
    handleMiniSidenav();

    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, transparentSidenav, whiteSidenav]);

  const handleToggleExpand = (key) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderRoute = (item, level = 0) => {
    const { type, name, icon, title, noCollapse, key, href, route, collapse } = item;
    const paddingLeft = level > 0 ? { paddingLeft: level * 1.5 + 'rem' } : {};
    const isExpanded = expanded[key] || false;

    const checkActive = (routeKey, children = []) => {
      if (routeKey === collapseName) return true;
      if (children.length > 0) {
        return children.some(child =>
          (child.key === collapseName) ||
          (child.collapse && checkActive(child.key, child.collapse))
        );
      }
      return false;
    };

    const isActive = checkActive(key, collapse);

    if (type === "collapse") {
      if (collapse && collapse.length > 0) {
        return (
          <MDBox key={key}>
            <SidenavCollapse
              name={name}
              icon={icon}
              active={isActive}
              hasChildren={true}
              isExpanded={isExpanded}
              onClick={() => handleToggleExpand(key)}
              noCollapse={noCollapse}
              sx={paddingLeft}
            />
            <List
              sx={{
                pl: 0,
                ml: level > 0 ? 3 : 0,
                borderLeft: level > 0 ? `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                maxHeight: isExpanded ? '1000px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-in-out',
                opacity: isExpanded ? 1 : 0,
                visibility: isExpanded ? 'visible' : 'hidden',
                display: 'block'
              }}
            >
              {collapse.map((collapseItem) => renderRoute(collapseItem, level + 1))}
            </List>
          </MDBox>
        );
      }

      return href ? (
        <Link
          href={href}
          key={key}
          target="_blank"
          rel="noreferrer"
          sx={{ textDecoration: "none" }}
        >
          <SidenavCollapse
            name={name}
            icon={icon}
            active={key === collapseName}
            noCollapse={noCollapse}
            hasChildren={false}
            sx={paddingLeft}
          />
        </Link>
      ) : (
        <NavLink key={key} to={route || "#"} style={{ textDecoration: 'none' }}>
          {({ isActive: navActive }) => (
            <SidenavCollapse
              name={name}
              icon={icon}
              active={navActive || key === collapseName}
              hasChildren={false}
              sx={paddingLeft}
            />
          )}
        </NavLink>
      );
    } else if (type === "title") {
      return (
        <MDTypography
          key={key}
          color={textColor}
          display="block"
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
          pl={3}
          mt={2}
          mb={1}
          ml={1}
          sx={paddingLeft}
        >
          {title}
        </MDTypography>
      );
    } else if (type === "divider") {
      return (
        <Divider
          key={key}
          light={
            (!darkMode && !whiteSidenav && !transparentSidenav) ||
            (darkMode && !transparentSidenav && whiteSidenav)
          }
        />
      );
    }

    return null;
  };

  return (
    <SidenavRoot
      {...rest}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <MDBox pt={3} pb={1} px={4} textAlign="center">
        <MDBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <MDTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </MDTypography>
        </MDBox>
        <MDBox component={NavLink} to="/" display="flex" alignItems="center">
          {brand && <MDBox component="img" src={brand} alt="Brand" width="2rem" />}
          <MDBox
            width={!brandName && "100%"}
            sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
          >
            <MDTypography component="h6" variant="button" fontWeight="medium" color={textColor}>
              {brandName}
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
      <Divider
        light={
          (!darkMode && !whiteSidenav && !transparentSidenav) ||
          (darkMode && !transparentSidenav && whiteSidenav)
        }
      />
      <List>{filteredRoutes.map(route => renderRoute(route))}</List>
    </SidenavRoot>
  );
}

Sidenav.defaultProps = {
  color: "warning",
  brand: "",
};

Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
