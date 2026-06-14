// testRoutes.jsx - Routes only available in development environment
import React from "react";
import Icon from "@mui/material/Icon";
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import WidgetsIcon from '@mui/icons-material/Widgets';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Import test components
import TestingJSX from "./testing/testing_jsx/TestingJSX";
import TestLevel2 from "./testing/testing_jsx/TestLevel2";
import TestLevel3 from "./testing/testing_jsx/TestLevel3";

const testRoutes = [
  {
    type: "title",
    title: "TEST ROUTES",
    key: "test-routes-title",
  },
  {
    type: "collapse",
    name: "JSX Testing",
    key: "test-jsx",
    icon: <CodeIcon fontSize="small" />,
    route: "/test/jsx",
    component: <TestingJSX />,
  },
  {
    type: "collapse",
    name: "UI Components",
    key: "test-components",
    icon: <BugReportIcon fontSize="small" />,
    route: "/test/components",
    component: <TestingJSX />,
  },
  {
    type: "title",
    title: "NESTED MENU TESTS",
    key: "nested-menu-title",
  },
  {
    type: "collapse",
    name: "All Test Routes",
    key: "all-tests",
    icon: <Icon fontSize="small">science</Icon>,
    collapse: [
      {
        type: "collapse",
        name: "JSX Tests",
        key: "jsx-tests",
        route: "/test/jsx",
        component: <TestingJSX />,
        icon: <CodeIcon fontSize="small" />,
      },
      {
        type: "collapse",
        name: "Component Tests",
        key: "component-tests",
        route: "/test/components",
        component: <TestingJSX />,
        icon: <BugReportIcon fontSize="small" />,
      },
      {
        type: "collapse",
        name: "Nested Tests",
        key: "nested-tests",
        icon: <WidgetsIcon fontSize="small" />,
        collapse: [
          {
            type: "collapse",
            name: "Level 2 Test",
            key: "level-2-test",
            route: "/test/level2",
            component: <TestLevel2 />,
            icon: <Icon fontSize="small">extension</Icon>,
          },
          {
            type: "collapse",
            name: "Level 2 Options",
            key: "level-2-options",
            icon: <SettingsIcon fontSize="small" />,
            collapse: [
              {
                type: "collapse",
                name: "Level 3 Test A",
                key: "level-3-test-a",
                route: "/test/level3a",
                component: <TestLevel3 variant="A" />,
                icon: <Icon fontSize="small">star</Icon>,
              },
              {
                type: "collapse",
                name: "Level 3 Test B",
                key: "level-3-test-b",
                route: "/test/level3b",
                component: <TestLevel3 variant="B" />,
                icon: <Icon fontSize="small">favorite</Icon>,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "collapse",
    name: "Dashboard Tests",
    key: "dashboard-tests",
    icon: <DashboardIcon fontSize="small" />,
    collapse: [
      {
        type: "collapse",
        name: "Overview",
        key: "overview",
        route: "/test/dashboard/overview",
        component: <TestingJSX />,
        icon: <Icon fontSize="small">home</Icon>,
      },
      {
        type: "collapse",
        name: "Test Lists",
        key: "test-lists",
        icon: <FormatListBulletedIcon fontSize="small" />,
        collapse: [
          {
            type: "collapse",
            name: "Section A",
            key: "section-a",
            route: "/test/dashboard/section-a",
            component: <TestingJSX />,
            icon: <Icon fontSize="small">list</Icon>,
          },
          {
            type: "collapse",
            name: "Section B",
            key: "section-b",
            route: "/test/dashboard/section-b",
            component: <TestingJSX />,
            icon: <Icon fontSize="small">list</Icon>,
          },
        ],
      },
    ],
  },
];

export default testRoutes;
