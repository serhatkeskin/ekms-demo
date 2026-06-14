import { forwardRef } from "react";
import MDBoxRoot from "components/MDBox/MDBoxRoot";

const Root: any = MDBoxRoot;

const MDBox = forwardRef<any, any>(
  ({ variant = "contained", bgColor = "transparent", color = "dark", opacity = 1, borderRadius = "none", shadow = "none", coloredShadow = "none", children = null, ...rest }, ref) => (
    <Root {...rest} ref={ref} ownerState={{ variant, bgColor, color, opacity, borderRadius, shadow, coloredShadow }}>
      {children}
    </Root>
  )
);

export default MDBox;
