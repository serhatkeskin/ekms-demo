// components/Pages/PageHeader.jsx
import React, { useState, useRef } from 'react';
import Icon from "@mui/material/Icon";
import EmojiPicker from 'emoji-picker-react';
import PageCover from 'components/Pages/components/PageCover';

const PageHeader = ({ 
  page, 
  title, 
  setTitle, 
  editingTitle, 
  setEditingTitle, 
  editingIcon, 
  setEditingIcon, 
  showEmojiPicker, 
  setShowEmojiPicker, 
  saveIcon, 
  saveTitle, 
  handleCoverImageChange, 
  isUploadingCover,
  canEdit 
}: any) => {
  const titleFieldRef = useRef(null);

  // Handle changes to page title
  const titleChange = (e) => {
    setTitle(e.target.value);
  };

  // Handle pressing Enter in the title field
  const titleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      setEditingTitle(false);
      setTitle(page.title); // Reset to original title
    }
  };

  // Handle clicking on the page title to edit it
  const titleClick = () => {
    if (!canEdit) return;
    
    setEditingTitle(true);
    setTimeout(() => {
      if (titleFieldRef.current) {
        titleFieldRef.current.focus();
      }
    }, 0);
  };

  return (
    <>
      {/* Page Title & Status */}
      <div className="page-header">
        <div className="page-icon-container">
          {editingIcon ? (
            <div style={{ position: 'relative' }}>
              {showEmojiPicker && (
                <div style={{ position: 'absolute', zIndex: 100 }}>
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      const emoji = emojiData.emoji;
                      saveIcon(emoji);
                      setEditingIcon(false);
                      setShowEmojiPicker(false);
                    }}
                    autoFocusSearch={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <div 
              className={`page-icon ${canEdit ? 'can-edit' : ''}`}
              onClick={() => {
                if (canEdit) {
                  setEditingIcon(true);
                  setShowEmojiPicker(true);
                }
              }}
            >
              {page.icon || <Icon>emoji_objects</Icon>}
            </div>
          )}
        </div>

        {editingTitle ? (
          <input
            ref={titleFieldRef}
            className="page-title-editor"
            value={title}
            onChange={titleChange}
            onBlur={saveTitle}
            onKeyDown={titleKeyDown}
          />
        ) : (
          <h1 
            className={`page-title ${canEdit ? 'can-edit' : ''}`} 
            onClick={titleClick}
          >
            {page.title}
          </h1>
        )}
        
        {page.status === 'draft' && (
          <span className="page-status page-status-draft">Draft</span>
        )}
        
        {page.status === 'archived' && (
          <span className="page-status page-status-archived">Archived</span>
        )}
      </div>
      
      {/* Cover Image (if present) */}
      {page.cover_image && (
        <PageCover
          src={page.cover_image.url || page.cover_image}
          onCoverChange={handleCoverImageChange}
          disabled={!canEdit}
          isUploading={isUploadingCover}
        />
      )}
    </>
  );
};

export default PageHeader;