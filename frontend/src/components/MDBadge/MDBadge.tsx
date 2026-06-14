import { forwardRef } from "react";
import MDBadgeRoot from "components/MDBadge/MDBadgeRoot";

const Root: any = MDBadgeRoot;

const MDBadge = forwardRef<any, any>(({ color = "info", variant = "gradient", size = "sm", circular = false, indicator = false, border = false, container = false, children = null, ...rest }, ref) => (
  <Root {...rest} ref={ref} color="default" ownerState={{ color, variant, size, circular, indicator, border, container, children }}>
    {children}
  </Root>
));

export default MDBadge;
