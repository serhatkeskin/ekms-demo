// TestingTSX.tsx - Simple TypeScript component for testing
import React, { useState } from 'react';

interface TestProps {
  title?: string;
  maxCount?: number;
}

const TestingTSX: React.FC<TestProps> = ({ 
  title = "TypeScript Testing Component", 
  maxCount = 10 
}) => {
  const [count, setCount] = useState<number>(0);
  const [items, setItems] = useState<string[]>([]);

  const incrementCount = (): void => {
    if (count < maxCount) {
      setCount(count + 1);
      setItems([...items, `Item ${count + 1}`]);
    }
  };

  const resetCount = (): void => {
    setCount(0);
    setItems([]);
  };

  // Styles with TypeScript types
  const styles: {[key: string]: React.CSSProperties} = {
    container: {
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      maxWidth: '500px',
      margin: '20px 0'
    },
    button: {
      padding: '8px 16px',
      margin: '0 8px',
      background: '#0066cc',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    resetButton: {
      background: '#cc0000'
    },
    list: {
      margin: '20px 0',
      paddingLeft: '20px'
    }
  };

  return (
    <div style={styles.container}>
      <h2>{title}</h2>
      <p>Current count: <strong>{count}</strong> (Maximum: {maxCount})</p>
      
      <div>
        <button 
          style={styles.button} 
          onClick={incrementCount}
          disabled={count >= maxCount}
        >
          Increment
        </button>
        
        <button 
          style={{...styles.button, ...styles.resetButton}} 
          onClick={resetCount}
        >
          Reset
        </button>
      </div>
      
      {items.length > 0 && (
        <>
          <h3>Items:</h3>
          <ul style={styles.list}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      )}
      
      <p><em>This is a TypeScript React component.</em></p>
    </div>
  );
};

export default TestingTSX;
