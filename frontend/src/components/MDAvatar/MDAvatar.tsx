import { forwardRef } from "react";
import MDAvatarRoot from "components/MDAvatar/MDAvatarRoot";

const Root: any = MDAvatarRoot;

const MDAvatar = forwardRef<any, any>(({ bgColor = "transparent", size = "md", shadow = "none", ...rest }, ref) => (
  <Root ref={ref} ownerState={{ shadow, bgColor, size }} {...rest} />
));

export default MDAvatar;
