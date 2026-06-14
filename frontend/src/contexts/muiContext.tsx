import { createContext, useContext, useReducer, useMemo, ReactNode, Dispatch } from "react";

type SidenavColor = "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark";

interface MaterialUIState {
  miniSidenav: boolean;
  transparentSidenav: boolean;
  whiteSidenav: boolean;
  sidenavColor: SidenavColor;
  transparentNavbar: boolean;
  fixedNavbar: boolean;
  openConfigurator: boolean;
  direction: "ltr" | "rtl";
  layout: string;
  darkMode: boolean;
}

type ActionType =
  | { type: "MINI_SIDENAV"; value: boolean }
  | { type: "TRANSPARENT_SIDENAV"; value: boolean }
  | { type: "WHITE_SIDENAV"; value: boolean }
  | { type: "SIDENAV_COLOR"; value: SidenavColor }
  | { type: "TRANSPARENT_NAVBAR"; value: boolean }
  | { type: "FIXED_NAVBAR"; value: boolean }
  | { type: "OPEN_CONFIGURATOR"; value: boolean }
  | { type: "DIRECTION"; value: "ltr" | "rtl" }
  | { type: "LAYOUT"; value: string }
  | { type: "DARKMODE"; value: boolean };

type MaterialUIContextType = [MaterialUIState, Dispatch<ActionType>];

const MaterialUI = createContext<MaterialUIContextType | null>(null);
MaterialUI.displayName = "MaterialUIContext";

function reducer(state: MaterialUIState, action: ActionType): MaterialUIState {
  switch (action.type) {
    case "MINI_SIDENAV":
      return { ...state, miniSidenav: action.value };
    case "TRANSPARENT_SIDENAV":
      return { ...state, transparentSidenav: action.value };
    case "WHITE_SIDENAV":
      return { ...state, whiteSidenav: action.value };
    case "SIDENAV_COLOR":
      return { ...state, sidenavColor: action.value };
    case "TRANSPARENT_NAVBAR":
      return { ...state, transparentNavbar: action.value };
    case "FIXED_NAVBAR":
      return { ...state, fixedNavbar: action.value };
    case "OPEN_CONFIGURATOR":
      return { ...state, openConfigurator: action.value };
    case "DIRECTION":
      return { ...state, direction: action.value };
    case "LAYOUT":
      return { ...state, layout: action.value };
    case "DARKMODE":
      return { ...state, darkMode: action.value };
    default:
      throw new Error(`Unhandled action type`);
  }
}

function MaterialUIControllerProvider({ children }: { children: ReactNode }) {
  const initialState: MaterialUIState = {
    miniSidenav: false,
    transparentSidenav: false,
    whiteSidenav: false,
    sidenavColor:
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_CUSTOM_APP_ENV === "development")
        ? "success"
        : "warning",
    transparentNavbar: true,
    fixedNavbar: true,
    openConfigurator: false,
    direction: "ltr",
    layout: "project_dashboard",
    darkMode: false,
  };

  const [controller, dispatch] = useReducer(reducer, initialState);
  const value = useMemo<MaterialUIContextType>(() => [controller, dispatch], [controller, dispatch]);

  return <MaterialUI.Provider value={value}>{children}</MaterialUI.Provider>;
}

function useMaterialUIController(): MaterialUIContextType {
  const context = useContext(MaterialUI);
  if (!context) {
    throw new Error("useMaterialUIController should be used inside the MaterialUIControllerProvider.");
  }
  return context;
}

const setMiniSidenav = (dispatch: Dispatch<ActionType>, value: boolean) => dispatch({ type: "MINI_SIDENAV", value });
const setTransparentSidenav = (dispatch: Dispatch<ActionType>, value: boolean) => dispatch({ type: "TRANSPARENT_SIDENAV", value });
const setWhiteSidenav = (dispatch: Dispatch<ActionType>, value: boolean) => dispatch({ type: "WHITE_SIDENAV", value });
const setSidenavColor = (dispatch: Dispatch<ActionType>, value: SidenavColor) => dispatch({ type: "SIDENAV_COLOR", value });
const setTransparentNavbar = (dispatch: Dispatch<ActionType>, value: boolean) => dispatch({ type: "TRANSPARENT_NAVBAR", value });
const setFixedNavbar = (dispatch: Dispatch<ActionType>, value: boolean) => dispatch({ type: "FIXED_NAVBAR", value });
const setOpenConfigurator = (dispatch: Dispatch<ActionType>, value: boolean) => dispatch({ type: "OPEN_CONFIGURATOR", value });
const setDirection = (dispatch: Dispatch<ActionType>, value: "ltr" | "rtl") => dispatch({ type: "DIRECTION", value });
const setLayout = (dispatch: Dispatch<ActionType>, value: string) => dispatch({ type: "LAYOUT", value });
const setDarkMode = (dispatch: Dispatch<ActionType>, value: boolean) => dispatch({ type: "DARKMODE", value });

export {
  MaterialUIControllerProvider,
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
  setSidenavColor,
  setTransparentNavbar,
  setFixedNavbar,
  setOpenConfigurator,
  setDirection,
  setLayout,
  setDarkMode,
};
