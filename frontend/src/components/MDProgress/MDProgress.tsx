import { forwardRef } from "react";
import MDTypography from "components/MDTypography/MDTypography";
import MDProgressRoot from "components/MDProgress/MDProgressRoot";

const Root: any = MDProgressRoot;

const MDProgress = forwardRef<any, any>(({ variant = "contained", color = "info", value = 0, label = false, ...rest }, ref) => (
  <>
    {label && (
      <MDTypography variant="button" fontWeight="medium" color="text">
        {value}%
      </MDTypography>
    )}
    <Root {...rest} ref={ref} variant="determinate" value={value} ownerState={{ color, value, variant }} />
  </>
));

export default MDProgress;
