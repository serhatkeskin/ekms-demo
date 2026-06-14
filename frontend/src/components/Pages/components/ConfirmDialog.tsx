// components/Pages/ConfirmDialog.jsx
import React from 'react';

const ConfirmDialog = ({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: any) => {
  if (!open) return null;
  
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2 className="dialog-title">{title}</h2>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button 
            className="dialog-btn dialog-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="dialog-btn dialog-btn-confirm"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;