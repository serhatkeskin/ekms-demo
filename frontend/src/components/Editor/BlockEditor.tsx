// components/Editor/BlockEditor.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Icon from '@mui/material/Icon';
import MDBox from "components/MDBox/MDBox";
import MDButton from 'components/MDButton/MDButton';
import CircularProgress from '@mui/material/CircularProgress';
import UserMention from 'components/Search/UserMention';
import { extractMentions } from 'utilities/mentionUtils';
import './BlockEditor.css';

/**
 * BlockEditor component - A reusable text editor with mention support
 * 
 * @param {string} value - Current text value
 * @param {function} onChange - Function called when text changes
 * @param {function} onSubmit - Function called when form is submitted
 * @param {function} onCancel - Function called when editing is cancelled
 * @param {function} onMention - Function called when a user is mentioned
 * @param {string} placeholder - Placeholder text
 * @param {boolean} multiline - Whether to allow multiple lines
 * @param {number} minRows - Minimum number of rows
 * @param {React.RefObject} inputRef - Ref to the input element
 * @param {string} mode - Display mode ('default', 'inline', 'compact')
 * @param {string} icon - Icon to display at start of input
 * @param {boolean} loading - Whether submission is in progress
 * @param {boolean} autoFocus - Whether to focus the input automatically
 * @param {string} submitText - Text for submit button
 * @param {string} submitColor - Color for submit button
 * @param {string} cancelText - Text for cancel button
 * @param {boolean} showCancel - Whether to show the cancel button
 * @param {string} variant - Variant for TextField ('outlined', 'standard', 'filled')
 * @param {string} size - Size for TextField ('small', 'medium')
 * @param {object} textFieldProps - Additional props for TextField
 * @param {object} buttonProps - Additional props for submit button
 */
const BlockEditor = memo(({ 
  value = '',
  onChange,
  onSubmit,
  onCancel,
  onMention,
  placeholder = 'Type something...',
  multiline = true,
  minRows = 2,
  inputRef: externalInputRef = null,
  mode = 'default',
  icon = null,
  loading = false,
  autoFocus = false,
  submitText = 'Submit',
  submitColor = 'warning',
  cancelText = 'Cancel',
  showCancel = false,
  variant = 'outlined',
  size = 'small',
  textFieldProps = {},
  buttonProps = {}
}: any) => {
  const [inputValue, setInputValue] = useState(value);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const localInputRef = useRef(null);
  const inputRef = externalInputRef || localInputRef;

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
    
    // Extract mentions from the value
    if (value) {
      const mentions = extractMentions(value);
      setMentionedUsers(mentions);
    }
  }, [value]);

  // Handle text changes
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Call the change handler if provided
    if (onChange) {
      onChange(newValue, e);
    }
    
    // Extract mentioned users from the text
    const mentions = extractMentions(newValue);
    setMentionedUsers(mentions);
  }, [onChange]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || loading) return;
    
    if (onSubmit) {
      onSubmit(inputValue, mentionedUsers, e);
    }
  }, [inputValue, mentionedUsers, onSubmit, loading]);

  // Handle cancel button click
  const handleCancel = useCallback((e) => {
    if (onCancel) {
      onCancel(e);
    }
  }, [onCancel]);

  // Handle user mention
  const handleMention = useCallback((user) => {
    // Update the internal list of mentioned users
    if (!mentionedUsers.includes(user.username)) {
      setMentionedUsers(prev => [...prev, user.username]);
    }
    
    // Call the external onMention handler if provided
    if (onMention) {
      onMention(user, inputValue);
    }
  }, [mentionedUsers, onMention, inputValue]);

  // Handle mention input change
  const handleMentionInputChange = useCallback((newValue) => {
    setInputValue(newValue);
    
    // Call the change handler if provided
    if (onChange) {
      onChange(newValue, { target: { value: newValue } });
    }
  }, [onChange]);

  // Determine CSS class based on mode
  const editorClassName = `block-editor-input ${mode === 'compact' ? 'compact' : ''}`;

  return (
    <MDBox position="relative" component="form" onSubmit={handleSubmit} className="block-editor-container">
      <TextField
        inputRef={inputRef}
        fullWidth
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        multiline={multiline}
        minRows={minRows}
        variant={variant}
        size={size}
        autoFocus={autoFocus}
        disabled={loading}
        className={editorClassName}
        InputProps={{
          startAdornment: icon && (
            <InputAdornment position="start">
              <Icon>{icon}</Icon>
            </InputAdornment>
          ),
          ...textFieldProps.InputProps
        }}
        {...textFieldProps}
      />
      
      {/* Add UserMention component */}
      <UserMention 
        inputValue={inputValue}
        onInputChange={handleMentionInputChange}
        inputRef={inputRef}
        onMention={handleMention}
        anchorEl={inputRef?.current}
      />
      
      {/* Buttons row */}
      <MDBox mt={1} display="flex" justifyContent="flex-end" className="block-editor-buttons">
        {showCancel && (
          <MDButton 
            variant="text"
            color="dark"
            size="small"
            onClick={handleCancel}
            sx={{ mr: 1 }}
            className="block-editor-cancel-btn"
          >
            {cancelText}
          </MDButton>
        )}
        
        <MDButton 
          type="submit"
          color={submitColor} 
          size="small"
          disabled={!inputValue.trim() || loading}
          className="block-editor-submit-btn"
          {...buttonProps}
        >
          {loading ? (
            <CircularProgress size={16} color="inherit" className="block-editor-loader" />
          ) : null}
          {submitText}
        </MDButton>
      </MDBox>
    </MDBox>
  );
});

export default BlockEditor;