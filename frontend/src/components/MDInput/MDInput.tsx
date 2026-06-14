import { forwardRef } from "react";
import MDInputRoot from "components/MDInput/MDInputRoot";

const Root: any = MDInputRoot;

const MDInput = forwardRef<any, any>(({ error = false, success = false, disabled = false, ...rest }, ref) => (
  <Root {...rest} ref={ref} ownerState={{ error, success, disabled }} />
));

export default MDInput;
