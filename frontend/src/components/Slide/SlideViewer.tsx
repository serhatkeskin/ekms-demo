import React, { useState, useRef } from 'react';
import { pdfjs } from "react-pdf"

import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import FileUploader from './FileUploader';
import './SlideViewer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SlideViewer = ({ 
  docs, 
  handleFileUpload, 
  loading = false,
  error = null,
  defaultExpanded = false,
  className = '' 
}: any) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      className={`slide-viewer-container ${className} ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
    >
      {/* Header */}
      <div className="slide-viewer-header">
        <button
          className="slide-viewer-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className={`chevron ${isExpanded ? 'expanded' : ''}`}>▼</span>
          <span className="slide-viewer-title">
            Slide Viewer
          </span>
        </button>
        
        {isExpanded && docs?.length > 0 && (
          <div className="slide-viewer-header-actions">
            <button
              className="btn-icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="slide-viewer-content">
          {/* Upload */}
          <FileUploader
            onFileUpload={handleFileUpload}
            loading={loading}
            error={error}
            compact={docs.length > 0}
          />

          {/* Viewer */}
          {docs?.length > 0 && (
            <div className="doc-viewer-wrapper">
              <DocViewer
                documents={docs}
                pluginRenderers={DocViewerRenderers}
                style={{ height: isFullscreen ? '100vh' : '70vh', width: '100%' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SlideViewer);
