import { useState } from "react";
import Fade from "@mui/material/Fade";
import MDBox from "components/MDBox/MDBox";
import MDAlertRoot from "components/MDAlert/MDAlertRoot";
import MDAlertCloseIcon from "components/MDAlert/MDAlertCloseIcon";

const Root: any = MDAlertRoot;

function MDAlert({ color = "info", dismissible = false, children, ...rest }: any) {
  const [alertStatus, setAlertStatus] = useState("mount");
  const handleAlertStatus = () => setAlertStatus("fadeOut");

  const alertTemplate = (mount = true) => (
    <Fade in={mount} timeout={300}>
      <Root ownerState={{ color }} {...rest}>
        <MDBox display="flex" alignItems="center" color="white">
          {children}
        </MDBox>
        {dismissible && (
          <MDAlertCloseIcon onClick={mount ? handleAlertStatus : undefined}>&times;</MDAlertCloseIcon>
        )}
      </Root>
    </Fade>
  );

  switch (alertStatus) {
    case "mount": return alertTemplate();
    case "fadeOut": setTimeout(() => setAlertStatus("unmount"), 400); return alertTemplate(false);
    default: return null;
  }
}

export default MDAlert;
