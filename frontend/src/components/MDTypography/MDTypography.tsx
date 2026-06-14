import { forwardRef } from "react";
import MDTypographyRoot from "components/MDTypography/MDTypographyRoot";
import { useMaterialUIController } from "contexts/muiContext";

const Root: any = MDTypographyRoot;

const MDTypography = forwardRef<any, any>(
  ({ color = "dark", fontWeight = false, textTransform = "none", verticalAlign = "unset", textGradient = false, opacity = 1, children, ...rest }, ref) => {
    const [controller] = useMaterialUIController();
    const { darkMode } = controller;
    return (
      <Root {...rest} ref={ref} ownerState={{ color, textTransform, verticalAlign, fontWeight, opacity, textGradient, darkMode }}>
        {children}
      </Root>
    );
  }
);

export default MDTypography;
