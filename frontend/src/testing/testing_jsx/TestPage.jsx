// TestPage.jsx
import React from 'react';
import TestComponent from './TestComponent';

const TestPage = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Testing JSX Rendering</h1>
      <p>Below is our test component:</p>
      
      {/* Import and render the test component */}
      <TestComponent />
      
      {/* Testing various HTML elements */}
      <div style={{ marginTop: '30px', border: '1px dashed #999', padding: '15px' }}>
        <h2>Other HTML Elements</h2>
        
        <h3>Form Elements</h3>
        <form onSubmit={(e) => { e.preventDefault(); console.log('Form submitted'); }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="name">Name: </label>
            <input id="name" type="text" placeholder="Enter your name" />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="email">Email: </label>
            <input id="email" type="email" placeholder="Enter your email" />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input type="checkbox" /> I agree to terms
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Gender: </label>
            <label style={{ marginRight: '10px' }}>
              <input type="radio" name="gender" value="male" /> Male
            </label>
            <label>
              <input type="radio" name="gender" value="female" /> Female
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="country">Country: </label>
            <select id="country">
              <option value="">Select a country</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
            </select>
          </div>
          
          <button type="submit">Submit</button>
        </form>
        
        <h3>Table Example</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Age</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Country</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>John Doe</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>30</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>USA</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Jane Smith</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>25</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Canada</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestPage;
