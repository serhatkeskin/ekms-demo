// TestComponent.jsx
import React from 'react';

// Simple test component to verify JSX rendering capabilities
const TestComponent = () => {
  // Test data
  const heading = "Test Component";
  const items = ["Item 1", "Item 2", "Item 3"];
  
  // Test styles
  const containerStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px',
    background: '#f9f9f9',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '500px'
  };
  
  const headingStyle = {
    color: '#333',
    borderBottom: '2px solid #333',
    paddingBottom: '10px',
    marginBottom: '20px'
  };
  
  const listItemStyle = {
    padding: '8px',
    margin: '4px 0',
    backgroundColor: '#eee',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  };
  
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>{heading}</h2>
      
      <p>This is a simple test component to verify JSX rendering.</p>
      
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {items.map((item, index) => (
          <li 
            key={index} 
            style={listItemStyle}
            onClick={() => console.log(`Clicked: ${item}`)}
          >
            {item}
          </li>
        ))}
      </ul>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={() => alert('Button clicked!')}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Click Me
        </button>
        
        <input 
          type="text" 
          placeholder="Type something..."
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>
    </div>
  );
};

export default TestComponent;
