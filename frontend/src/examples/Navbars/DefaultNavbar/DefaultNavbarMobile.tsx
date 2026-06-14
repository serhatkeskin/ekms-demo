// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Menu from "@mui/material/Menu";

// EKMS React components
import MDBox from "components/MDBox/MDBox";

// EKMS React example components
import DefaultNavbarLink from "examples/Navbars/DefaultNavbar/DefaultNavbarLink";

function DefaultNavbarMobile({ open, close }: any) {
  const { width } = open && open.getBoundingClientRect();

  return (
    <Menu
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      anchorEl={open}
      open={Boolean(open)}
      onClose={close}
      MenuListProps={{ style: { width: `calc(${width}px - 4rem)` } }}
    >
      <MDBox px={0.5}>
        {/* <DefaultNavbarLink icon="donut_large" name="dashboard" route="/dashboard/project" light={true} />
        <DefaultNavbarLink icon="person" name="profile" route="/profile" light={true} /> */}
        <DefaultNavbarLink icon="account_circle" name="sign up" route="/authentication/sign-up" light={true} />
        <DefaultNavbarLink icon="key" name="sign in" route="/authentication/sign-in" light={true} />
      </MDBox>
    </Menu>
  );
}

// Typechecking props for the DefaultNavbarMenu
DefaultNavbarMobile.propTypes = {
  open: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]).isRequired,
  close: PropTypes.oneOfType([PropTypes.func, PropTypes.bool, PropTypes.object]).isRequired,
};

export default DefaultNavbarMobile;