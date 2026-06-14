import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import Icon from "@mui/material/Icon";
import MDSnackbar from "components/MDSnackbar/MDSnackbar";

// Types
type ColorType = "success" | "info" | "warning" | "error" | "primary" | "secondary" | "light" | "dark";

interface SnackbarState {
  open: boolean;
  color: ColorType;
  icon: ReactNode;
  title: string;
  content: string;
  dateTime: string;
}

interface UIContextType {
  showNotification: (color: ColorType, title: string, content: string) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextType | null>(null);
UIContext.displayName = "UIContext";

export function UIProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    color: "info",
    icon: <Icon>info</Icon>,
    title: "",
    content: "",
    dateTime: "",
  });

  const [isLoading, setLoading] = useState(false);

  const showNotification = useCallback((color: ColorType, title: string, content: string) => {
    let icon;
    switch (color) {
      case "success": icon = <Icon>check_circle</Icon>; break;
      case "error": icon = <Icon>error</Icon>; break;
      case "warning": icon = <Icon>warning</Icon>; break;
      case "info": icon = <Icon>info</Icon>; break;
      default: icon = <Icon>notifications</Icon>;
    }
    
    setSnackbar({
      open: true,
      color,
      icon,
      title,
      content,
      dateTime: new Date().toLocaleString(),
    });
  }, []);

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const value = {
    showNotification,
    isLoading,
    setLoading
  };

  return (
    <UIContext.Provider value={value}>
      {children}
      <MDSnackbar
        color={snackbar.color}
        icon={snackbar.icon}
        title={snackbar.title}
        content={snackbar.content}
        dateTime={snackbar.dateTime}
        open={snackbar.open}
        close={closeSnackbar}
      />
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
