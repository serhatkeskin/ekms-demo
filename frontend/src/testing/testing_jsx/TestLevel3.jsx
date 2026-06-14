// TestLevel3.jsx
import React from 'react';

// Level 3 test component to verify deeply nested routes
const TestLevel3 = ({ variant = 'A' }) => {
  // Test styles
  const containerStyle = {
    border: '1px solid #2196f3', // Blue border for Level 3
    borderRadius: '8px',
    padding: '20px',
    margin: '20px',
    background: '#e3f2fd', // Light blue background
    fontFamily: 'Arial, sans-serif',
    maxWidth: '500px'
  };
  
  const headingStyle = {
    color: '#0d47a1',
    borderBottom: '2px solid #0d47a1',
    paddingBottom: '10px',
    marginBottom: '20px'
  };
  
  const buttonStyle = {
    backgroundColor: '#2196f3',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Level 3 Nested Component - Variant {variant}</h2>
      <p>This component demonstrates a very deep nested route works correctly.</p>
      
      <p>The component was rendered from a Level 3 nested route in the sidebar.</p>
      
      <div>
        <button 
          style={buttonStyle}
          onClick={() => alert(`Level 3 component variant ${variant} clicked!`)}
        >
          Click Me
        </button>
      </div>
      
      <div style={{marginTop: '20px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px'}}>
        <p><strong>Path info:</strong> /test/level3{variant.toLowerCase()}</p>
        <p><strong>Route level:</strong> 3 (deeply nested)</p>
        <p><strong>Variant:</strong> {variant}</p>
      </div>
    </div>
  );
};

export default TestLevel3;
