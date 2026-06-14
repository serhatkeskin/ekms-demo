// components/Pages/AddBlockButton.jsx
import React from 'react';

const AddBlockButton = ({ onClick, disabled }: any) => {
  return (
    <div className="add-block-container">
      <button 
        className="add-block-button"
        onClick={onClick}
        disabled={disabled}
      >
        <i className="fas fa-plus"></i> Add Block
      </button>
    </div>
  );
};

export default AddBlockButton;