import Snackbar from "@mui/material/Snackbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Divider from "@mui/material/Divider";
import Fade from "@mui/material/Fade";
import MDBox from "components/MDBox/MDBox";
import MDTypography from "components/MDTypography/MDTypography";
import MDSnackbarIconRoot from "components/MDSnackbar/MDSnackbarIconRoot";
import { useMaterialUIController } from "contexts/muiContext";

const IconRoot: any = MDSnackbarIconRoot;

function MDSnackbar({ color = "info", icon, title, dateTime, content, close, bgWhite = false, ...rest }: any) {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  let titleColor: any, dateTimeColor: any, dividerColor: any;
  if (bgWhite) { titleColor = color; dateTimeColor = "dark"; dividerColor = false; }
  else if (color === "light") { titleColor = darkMode ? "inherit" : "dark"; dateTimeColor = darkMode ? "inherit" : "text"; dividerColor = false; }
  else { titleColor = "white"; dateTimeColor = "white"; dividerColor = true; }

  return (
    <Snackbar TransitionComponent={Fade} autoHideDuration={5000} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} {...rest}
      action={<IconButton size="small" aria-label="close" color="inherit" onClick={close}><Icon fontSize="small">close</Icon></IconButton>}>
      <MDBox variant={bgWhite ? "contained" : "gradient"} bgColor={bgWhite ? "white" : color} minWidth="21.875rem" maxWidth="100%" shadow="md" borderRadius="md" p={1}
        sx={{ backgroundColor: ({ palette }: any) => darkMode ? (palette.background?.card || palette.background?.paper) : (palette[color]?.main || palette.white?.main || palette.common?.white || "#ffffff") }}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" color="dark" p={1.5}>
          <MDBox display="flex" alignItems="center" lineHeight={0}>
            <IconRoot fontSize="small" ownerState={{ color, bgWhite }}>{icon}</IconRoot>
            <MDTypography variant="button" fontWeight="medium" color={titleColor} textGradient={bgWhite}>{title}</MDTypography>
          </MDBox>
          <MDBox display="flex" alignItems="center" lineHeight={0}>
            <MDTypography variant="caption" color={dateTimeColor}>{dateTime}</MDTypography>
            <Icon sx={{ color: ({ palette }: any) => bgWhite || color === "light" ? (palette.dark?.main || palette.text?.primary || "#344767") : (palette.white?.main || palette.common?.white || "#ffffff"), fontWeight: ({ typography: { fontWeightBold } }: any) => fontWeightBold, cursor: "pointer", marginLeft: 2, transform: "translateY(-1px)" }} onClick={close}>close</Icon>
          </MDBox>
        </MDBox>
        <Divider sx={{ margin: 0 }} light={dividerColor} />
        <MDBox p={1.5} sx={{ fontSize: ({ typography: { size } }: any) => size.sm, color: ({ palette }: any) => { 
            if (bgWhite) return darkMode ? (palette.text?.main || palette.text?.primary) : (palette.dark?.main || palette.text?.primary || "#344767"); 
            if (color === "light") return palette.text?.main || palette.text?.primary; 
            return palette.white?.main || palette.common?.white || "#ffffff"; 
        }}}>
          {content}
        </MDBox>
      </MDBox>
    </Snackbar>
  );
}

export default MDSnackbar;
