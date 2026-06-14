import { useState, useRef } from "react";
import PropTypes from "prop-types";
import MDBox from "components/MDBox/MDBox";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CircularProgress from "@mui/material/CircularProgress";

function PageCoverImage({ src, onCoverChange, disabled, isUploading }: any) {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file && onCoverChange) {
      onCoverChange(file);
    }
    
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      <img 
        src={src} 
        alt="Cover image" 
        className="page-cover-image" 
        style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
      />
      
      {/* Only show hover overlay if the user can edit */}
      {isHovering && !disabled && (
        <MDBox
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          borderRadius="8px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(0, 0, 0, 0.5)"
          zIndex={1}
        >
          <CameraAltIcon sx={{ color: 'white', fontSize: '2rem' }} />
        </MDBox>
      )}
      
      {/* Only show loading indicator if upload is in progress */}
      {isUploading && (
        <MDBox
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          borderRadius="8px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(0, 0, 0, 0.5)"
          zIndex={1}
        >
          <CircularProgress size={40} sx={{ color: 'white' }} />
        </MDBox>
      )}
    </MDBox>
  );
}

PageCoverImage.defaultProps = {
  disabled: false,
  isUploading: false,
  onCoverChange: null
};

PageCoverImage.propTypes = {
  src: PropTypes.string.isRequired,
  onCoverChange: PropTypes.func,
  disabled: PropTypes.bool,
  isUploading: PropTypes.bool
};

export default PageCoverImage;