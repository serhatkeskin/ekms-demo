import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Breadcrumbs as MuiBreadcrumbs } from "@mui/material";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox/MDBox";
import MDTypography from "components/MDTypography/MDTypography";

function Breadcrumbs({ icon, title, route, light }: any) {
  // Normalize route items - handle both string and object formats
  const normalizedRoute = route.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return { slug: item, title: item, url: item };
    }
    return item;
  });

  return (
    <MDBox mr={{ xs: 0, xl: 8 }}>
      <MuiBreadcrumbs
        separator="/"
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: ({ palette: { white, grey } }: any) => (light ? white.main : grey[600]),
          },
        }}
      >
        <Link to="/dashboard/project"> {/* Home link */}
          <MDTypography
            component="span"
            variant="body2"
            color={light ? "white" : "dark"}
            opacity={light ? 0.8 : 0.5}
            sx={{
              lineHeight: 0,
              transition: 'color 0.3s ease',
              '&:hover': {
                color: (theme: any) => theme.palette.warning.main,
              },
            }}
          >
            <Icon>{icon}</Icon>
          </MDTypography>
        </Link>

        {/* Render all except last as links */}
        {normalizedRoute.slice(0, -1).map((item: any) => (
          <Link to={`/${item.url}`} key={item.url || item.slug}>
            <MDTypography
              component="span"
              variant="button"
              fontWeight="regular"
              textTransform="capitalize"
              color={light ? "white" : "dark"}
              opacity={light ? 0.8 : 0.5}
              sx={{
                lineHeight: 0,
                "&:hover": {
                  color: "warning.main",
                },
              }}
            >
              {item.title}
            </MDTypography>
          </Link>
        ))}

        {/* Current page (not a link) */}
        <MDTypography
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          color={light ? "white" : "dark"}
          sx={{ lineHeight: 0 }}
        >
          {title}
        </MDTypography>
      </MuiBreadcrumbs>

      {/* Page Title Heading */}
      <MDTypography
        fontWeight="bold"
        textTransform="capitalize"
        variant="h6"
        color={light ? "white" : "dark"}
        noWrap
      >
        {title}
      </MDTypography>
    </MDBox>
  );
}

Breadcrumbs.defaultProps = {
  light: false,
};

Breadcrumbs.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  route: PropTypes.array.isRequired,
  light: PropTypes.bool,
};

export default Breadcrumbs;
