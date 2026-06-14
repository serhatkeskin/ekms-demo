// TestLevel2.jsx
import React from 'react';

// Level 2 test component to verify nested routes
const TestLevel2 = () => {
  // Test styles
  const containerStyle = {
    border: '1px solid #e91e63', // Pink border
    borderRadius: '8px',
    padding: '20px',
    margin: '20px',
    background: '#fce4ec', // Light pink background
    fontFamily: 'Arial, sans-serif',
    maxWidth: '500px'
  };
  
  const headingStyle = {
    color: '#c2185b',
    borderBottom: '2px solid #c2185b',
    paddingBottom: '10px',
    marginBottom: '20px'
  };
  
  const buttonStyle = {
    backgroundColor: '#e91e63',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Level 2 Nested Component</h2>
      <p>This component demonstrates a deeply nested route works correctly.</p>
      
      <p>The component was rendered from a Level 2 nested route in the sidebar.</p>
      
      <div>
        <button 
          style={buttonStyle}
          onClick={() => alert('Level 2 component clicked!')}
        >
          Click Me
        </button>
      </div>
      
      <div style={{marginTop: '20px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '4px'}}>
        <p><strong>Path info:</strong> /test/level2</p>
        <p><strong>Route level:</strong> 2 (nested under "Nested Tests")</p>
      </div>
    </div>
  );
};

export default TestLevel2;
