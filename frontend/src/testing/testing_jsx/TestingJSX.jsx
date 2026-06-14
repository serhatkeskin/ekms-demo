// TestingJSX.jsx - Import this file to test JSX rendering
import React from 'react';
import TestPage from './TestPage';

const TestingJSX = () => {
  console.log("Testing JSX rendering...");
  return (
    <div className="testing-jsx-container" style={{ padding: '20px' }}>
      <h1>JSX Testing Page</h1>
      <p>This page demonstrates that JSX is rendering properly in the application.</p>
      <TestPage />
    </div>
  );
};

export default TestingJSX;
