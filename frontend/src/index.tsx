import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// contexts
import { MaterialUIControllerProvider } from "contexts/muiContext";
import { AuthProvider } from "contexts/auth/AuthContext";
import { PermissionsProvider } from "contexts/permissions/PermissionsContext";

const container = document.getElementById("app");
const root = createRoot(container);

// TODO we may need to change AuthProvider order
root.render(
  <BrowserRouter>
    <AuthProvider>
      <PermissionsProvider>
        <MaterialUIControllerProvider>
          <App />
        </MaterialUIControllerProvider>
      </PermissionsProvider>
    </AuthProvider>
  </BrowserRouter>
);