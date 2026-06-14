import React from "react";
import { CircularProgress } from "@mui/material";
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import { useAuth } from "contexts/auth/AuthContext";
import { useMaterialUIController } from "contexts/muiContext";

export default function LoadingPopup({ show }: any) {
  const [auth] = useAuth();
  const { loading } = auth;
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;
  const visible = typeof show === "boolean" ? show : loading;

  return (
    <MDBox
      position="fixed"
      top={0}
      left={0}
      width="100%"
      height="100%"
      display={visible ? "flex" : "none"}
      justifyContent="center"
      alignItems="center"
      zIndex={9999}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)"
      }}
    >
      <MDBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        p={4}
        borderRadius="lg"
        shadow="xl"
        sx={{
          backgroundColor: darkMode ? "#1a2035" : "#ffffff",
          maxWidth: "320px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <CircularProgress color="warning" size={56} thickness={4} />
        <MDTypography variant="h6" fontWeight="medium" mt={3} mb={0.5}>
          Loading EKMS
        </MDTypography>
        <MDTypography variant="body2" color="text" fontWeight="regular">
          Please wait...
        </MDTypography>
      </MDBox>
    </MDBox>
  );
}
