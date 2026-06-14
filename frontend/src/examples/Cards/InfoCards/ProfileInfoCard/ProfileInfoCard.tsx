// react-routers components
import { useState } from "react";

// prop-types is library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from 'components/MDButton/MDButton';

// EKMS React base styles
import colors from "assets/theme/base/colors";
import typography from "assets/theme/base/typography";

function ProfileInfoCard({ title, description, info, social, action, shadow, onSubmit, editable }: any) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: info.fullName?.split(' ')[0] || '',
    lastName: info.fullName?.split(' ').slice(1).join(' ') || '',
    email: info.email || '',
    cell_phone: info.cell_phone || '',
    location: info.location || '',
    bio: description || ''
  });

  // Format labels for display
  const formatLabel = (label: any) => {
    // Handle underscore-separated words (e.g., cell_phone -> Cell Phone)
    if (label.includes('_')) {
      return label
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    // Handle camelCase (e.g., fullName -> full name)
    if (label.match(/[A-Z\s]+/)) {
      const uppercaseLetter: any = Array.from(label).find((i: any) => i.match(/[A-Z]+/));
      const newElement = label.replace(uppercaseLetter, ` ${uppercaseLetter.toLowerCase()}`);
      return newElement;
    }
    return label;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData);
    }
    setEditing(false);
  };

  // Toggle edit mode
  const toggleEdit = () => {
    if (editing) {
      // Cancel editing - reset form data
      setFormData({
        firstName: info.fullName?.split(' ')[0] || '',
        lastName: info.fullName?.split(' ').slice(1).join(' ') || '',
        email: info.email || '',
        cell_phone: info.cell_phone || '',
        location: info.location || '',
        bio: description || ''
      });
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  // Render the card info items in display mode
  const renderDisplayItems = () => {
    return Object.keys(info).map((key) => (
      <MDBox key={key} display="flex" py={1} pr={2}>
        <MDTypography variant="button" fontWeight="bold" textTransform="capitalize">
          {formatLabel(key)}: &nbsp;
        </MDTypography>
        <MDTypography variant="button" fontWeight="regular" color="text">
          &nbsp;{info[key]}
        </MDTypography>
      </MDBox>
    ));
  };

  // Render the edit form
  const renderEditForm = () => {
    return (
      <Box component="form" sx={{ mt: 1 }}>
        <MDBox mb={2}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            size="small"
          />
        </MDBox>
        <MDBox mb={2}>
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            size="small"
          />
        </MDBox>
        <MDBox mb={2}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            size="small"
          />
        </MDBox>
        <MDBox mb={2}>
          <TextField
            fullWidth
            label="Mobile"
            name="cell_phone"
            value={formData.cell_phone}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            size="small"
          />
        </MDBox>
        <MDBox mb={2}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            size="small"
          />
        </MDBox>
        <MDBox mb={2}>
          <TextField
            fullWidth
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
            variant="outlined"
            size="small"
          />
        </MDBox>
        <MDBox display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <MDButton
            variant="outlined"
            color="secondary"
            onClick={toggleEdit}
          >
            Cancel
          </MDButton>
          <MDButton
            variant="gradient"
            color="warning"
            onClick={handleSubmit}
          >
            Save Changes
          </MDButton>
        </MDBox>
      </Box>
    );
  };

  // Render the card social media icons
  const renderSocial = social.map(({ link, icon, color }) => (
    <MDBox
      key={color}
      component="a"
      href={link}
      target="_blank"
      rel="noreferrer"
      fontSize={typography.size.lg}
      color={colors.socialMediaColors[color].main}
      pr={1}
      pl={0.5}
      lineHeight={1}
    >
      {icon}
    </MDBox>
  ));

  return (
    <Card sx={{ height: "100%", boxShadow: !shadow && "none" }}>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" pt={2} px={2}>
        <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {title}
        </MDTypography>
        {editable && (
          <MDTypography 
            component="div" 
            variant="body2" 
            color="secondary"
            onClick={toggleEdit}
            sx={{ cursor: 'pointer' }}
          >
            <Tooltip title={editing ? "Cancel" : "Edit Profile"} placement="top">
              <Icon>{editing ? "close" : "edit"}</Icon>
            </Tooltip>
          </MDTypography>
        )}
      </MDBox>
      <MDBox p={2}>
        <MDBox mb={2} lineHeight={1}>
          {!editing ? (
            <MDTypography variant="button" color="text" fontWeight="light">
              {description}
            </MDTypography>
          ) : null}
        </MDBox>
        <MDBox opacity={0.3}>
          <Divider />
        </MDBox>
        <MDBox>
          {editing ? renderEditForm() : renderDisplayItems()}
          {social.length > 0 && (
            <MDBox display="flex" py={1} pr={2}>
              <MDTypography variant="button" fontWeight="bold" textTransform="capitalize">
                social: &nbsp;
              </MDTypography>
              {renderSocial}
            </MDBox>
          )}
        </MDBox>
      </MDBox>
    </Card>
  );
}

// Setting default props for the ProfileInfoCard
ProfileInfoCard.defaultProps = {
  shadow: true,
  social: [],
  editable: false,
  onSubmit: null,
};

// Typechecking props for the ProfileInfoCard
ProfileInfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  info: PropTypes.objectOf(PropTypes.string).isRequired,
  social: PropTypes.arrayOf(PropTypes.object),
  action: PropTypes.shape({
    route: PropTypes.string,
    tooltip: PropTypes.string,
    onClick: PropTypes.func,
  }),
  shadow: PropTypes.bool,
  editable: PropTypes.bool,
  onSubmit: PropTypes.func,
};

export default ProfileInfoCard;