// DevModeBanner.jsx - Simple banner shown only in development mode
import React, { CSSProperties } from 'react';

const DevModeBanner = () => {
  const bannerStyle: CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    left: '10px',
    backgroundColor: '#FF5722',
    color: 'white',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 10000,
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    opacity: 0.8,
  };

  const iconStyle = {
    fontSize: '16px',
  };

  const textStyle = {
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  return (
    <div style={bannerStyle}>
      <span style={iconStyle}>🧪</span>
      <span style={textStyle}>DEV MODE | TEST ROUTES ENABLED</span>
    </div>
  );
};

export default DevModeBanner;
