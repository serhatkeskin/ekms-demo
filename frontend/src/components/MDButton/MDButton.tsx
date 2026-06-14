import { forwardRef } from "react";
import MDButtonRoot from "components/MDButton/MDButtonRoot";
import { useMaterialUIController } from "contexts/muiContext";

const Root: any = MDButtonRoot;

const MDButton = forwardRef<any, any>(
  ({ color = "white", variant = "contained", size = "medium", circular = false, iconOnly = false, children, ...rest }, ref) => {
    const [controller] = useMaterialUIController();
    const { darkMode } = controller;
    return (
      <Root {...rest} ref={ref} color="primary" variant={variant === "gradient" ? "contained" : variant} size={size}
        ownerState={{ color, variant, size, circular, iconOnly, darkMode }}>
        {children}
      </Root>
    );
  }
);

export default MDButton;
