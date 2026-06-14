// FileUploader.js - File upload component for slides
import React, { useState, useRef } from 'react';
import './FileUploader.css';

const FileUploader = ({ onFileUpload, loading, error, compact = false }: any) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file) {
      onFileUpload(file);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-uploader ${compact ? 'compact-mode' : ''}`}>
      {/* Compact Mode: Just a small button */}
      {compact ? (
        <div className="compact-uploader">
          <button
            className="add-file-btn"
            onClick={handleBrowseClick}
            disabled={loading}
          >
            + Add File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        // Full drag-drop upload area
        <div
          className={`upload-area ${dragOver ? 'drag-over' : ''} ${loading ? 'loading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {loading ? (
            <div className="upload-loading">
              <div className="spinner"></div>
              <p>Processing file...</p>
              <small>This may take a moment for large files</small>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <h3>Upload File</h3>
              <p>Drag and drop your file here, or click to browse</p>
              <button
                className="browse-btn"
                onClick={handleBrowseClick}
                disabled={loading}
              >
                Browse Files
              </button>
              <div className="file-info">
                <small>Any file type • Max size: 50MB</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* Tips only in full mode */}
      {!compact && (
        <div className="upload-tips">
          <h4>Tips:</h4>
          <ul>
            <li>All files are stored securely</li>
            <li>You can upload multiple formats (PDF, PPTX, DOCX, etc.)</li>
          </ul>
        </div>
      )}
    </div>
  );

};

export default FileUploader;