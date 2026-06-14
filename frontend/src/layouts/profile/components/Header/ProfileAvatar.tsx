import { useState, useRef } from "react";
import PropTypes from "prop-types";
import MDAvatar from 'components/MDAvatar/MDAvatar';
import MDBox from "components/MDBox/MDBox";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CircularProgress from "@mui/material/CircularProgress";

function ProfileAvatar({ src, size, onAvatarChange, disabled }) {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleClick = () => {
    // Directly click the file input when the avatar is clicked
    if (!disabled && fileInputRef.current) {
      console.log("Triggering file input click");
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log("File selected:", file);
    
    if (file && onAvatarChange) {
      // Call the parent's handler with the selected file
      onAvatarChange(file);
    }
    
    // Reset the input value to allow selecting the same file again
    event.target.value = "";
  };
  
  return (
    <MDBox
      position="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
      sx={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      {/* Avatar display */}
      <MDAvatar src={src} alt="Profile" size={size} shadow="sm" />
      
      {/* Hover overlay with camera icon */}
      {isHovering && !disabled && (
        <MDBox
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          borderRadius="50%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(0, 0, 0, 0.5)"
          zIndex={1}
        >
          <CameraAltIcon sx={{ color: 'white' }} />
        </MDBox>
      )}
      
      {/* Loading indicator when disabled */}
      {disabled && (
        <MDBox
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          borderRadius="50%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(0, 0, 0, 0.5)"
          zIndex={1}
        >
          <CircularProgress size={24} sx={{ color: 'white' }} />
        </MDBox>
      )}
    </MDBox>
  );
}

ProfileAvatar.defaultProps = {
  size: "md",
  disabled: false,
  onAvatarChange: null
};

ProfileAvatar.propTypes = {
  src: PropTypes.string.isRequired,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", "xxl"]),
  onAvatarChange: PropTypes.func,
  disabled: PropTypes.bool
};

export default ProfileAvatar;