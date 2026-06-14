import { forwardRef, createContext, useContext, useMemo } from "react";
import MDBox from "components/MDBox/MDBox";
import MDPaginationItemRoot from "components/MDPagination/MDPaginationItemRoot";

const Context = createContext<any>(null);
const Root: any = MDPaginationItemRoot;

const MDPagination = forwardRef<any, any>(({ item = false, variant = "gradient", color = "info", size = "medium", active = false, children, ...rest }, ref) => {
  const context: any = useContext(Context);
  const paginationSize = context ? context.size : null;
  const value = useMemo(() => ({ variant, color, size }), [variant, color, size]);

  return (
    <Context.Provider value={value}>
      {item ? (
        <Root {...rest} ref={ref} variant={active ? context.variant : "outlined"} color={active ? context.color : "secondary"}
          iconOnly size={size === "small" ? "small" : "medium"} ownerState={{ variant, active, paginationSize }}>
          {children}
        </Root>
      ) : (
        <MDBox display="flex" justifyContent="flex-end" alignItems="center" sx={{ listStyle: "none" }}>
          {children}
        </MDBox>
      )}
    </Context.Provider>
  );
});

export default MDPagination;
