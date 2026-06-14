// src/components/UserMention/index.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Popper, ClickAwayListener, CircularProgress } from '@mui/material';
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDAvatar from 'components/MDAvatar/MDAvatar';
import searchApi from 'services/searchApi';

/**
 * UserMention component that handles the @ mention functionality
 * Enhanced to detect @ symbols anywhere in the text
 */
function UserMention({ inputValue, onInputChange, anchorEl, inputRef, onMention }: any) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [isMentioning, setIsMentioning] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionAnchorPosition, setMentionAnchorPosition] = useState(null);
  const listRef = useRef(null);
  const skipNextCheckRef = useRef(false);

  // Function to fetch users based on query
  const fetchUsers = useCallback(async (query) => {
    if (!query) return [];
    
    setLoading(true);
    try {
      // Use the searchApi.searchUsers method instead of direct fetch
      const data = await searchApi.searchUsers(query, { limit: 10 });
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get the cursor position in the input field
  const getCursorPosition = useCallback(() => {
    if (!inputRef || !inputRef.current) return 0;
    return inputRef.current.selectionStart;
  }, [inputRef]);

  // Check for @ in the input value to start mentioning
  useEffect(() => {
    // Skip this check if we've just added a mention
    if (skipNextCheckRef.current) {
      skipNextCheckRef.current = false;
      return;
    }

    const checkForMention = () => {
      if (!inputRef.current) return;

      // Get the current cursor position
      const cursorPosition = getCursorPosition();
      
      // Find the @ symbol nearest to the cursor position
      let atIndex = -1;
      let startIndex = Math.max(0, cursorPosition - 20); // Look back up to 20 characters from cursor
      
      // Get the substring from startIndex to cursor position
      const checkText = inputValue.substring(startIndex, cursorPosition);
      
      // Find the last @ in this substring
      const lastAtInSubstring = checkText.lastIndexOf('@');
      
      if (lastAtInSubstring !== -1) {
        atIndex = startIndex + lastAtInSubstring;
      }
      
      if (atIndex === -1) {
        setIsMentioning(false);
        setMentionIndex(-1);
        return;
      }

      // Check if @ is at the beginning or has a space before it
      const isValidMention = atIndex === 0 || /[\s\n]/.test(inputValue[atIndex - 1]);
      
      if (!isValidMention) {
        setIsMentioning(false);
        return;
      }

      // Extract query between @ and cursor position or space
      let endOfQuery = cursorPosition;
      for (let i = atIndex + 1; i < inputValue.length; i++) {
        // Stop at space, newline, or punctuation
        if (/[\s\n.,!?;:]/.test(inputValue[i])) {
          endOfQuery = i;
          break;
        }
      }
      
      const query = inputValue.substring(atIndex + 1, endOfQuery);
      
      // Don't show suggestions if we've already completed a username
      if (endOfQuery !== cursorPosition) {
        setIsMentioning(false);
        return;
      }
      
      setMentionQuery(query);
      setMentionIndex(atIndex);
      setIsMentioning(true);
      
      // Position the mention popup near the @ symbol
      if (inputRef.current) {
        // Try to calculate position based on text metrics
        try {
          // Create temporary element to measure text
          const span = document.createElement('span');
          span.style.visibility = 'hidden';
          span.style.position = 'absolute';
          span.style.whiteSpace = 'pre-wrap';
          span.style.font = window.getComputedStyle(inputRef.current).font;
          span.textContent = inputValue.substring(0, atIndex);
          
          document.body.appendChild(span);
          const rect = span.getBoundingClientRect();
          document.body.removeChild(span);
          
          // Get input element's position
          const inputRect = inputRef.current.getBoundingClientRect();
          
          // Calculate @ position relative to input
          setMentionAnchorPosition({
            left: Math.min(rect.width, inputRect.width),
            top: 24 // Slightly below the line
          });
        } catch (e) {
          console.error('Error calculating mention position:', e);
          // Fall back to default positioning
          setMentionAnchorPosition(null);
        }
      }
    };

    checkForMention();
  }, [inputValue, getCursorPosition, inputRef]);

  // Fetch users when mentioning starts or query changes
  useEffect(() => {
    if (isMentioning) {
      const getUsers = async () => {
        const fetchedUsers = await fetchUsers(mentionQuery);
        setUsers(fetchedUsers);
        setSelectedIndex(0); // Reset selection on new search
      };
      
      // Add a small delay to avoid too many API calls while typing
      const timeoutId = setTimeout(() => {
        getUsers();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isMentioning, mentionQuery, fetchUsers]);

  // Handle keyboard navigation in the mention list
  const handleKeyDown = (e) => {
    if (!isMentioning) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prevIndex) => 
          users.length > 0 ? (prevIndex + 1) % users.length : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prevIndex) => 
          users.length > 0 ? (prevIndex - 1 + users.length) % users.length : 0
        );
        break;
      case 'Enter':
        if (users.length > 0) {
          e.preventDefault();
          selectUser(users[selectedIndex]);
        }
        break;
      case 'Tab':
        if (users.length > 0) {
          e.preventDefault();
          selectUser(users[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsMentioning(false);
        break;
      default:
        break;
    }
  };

  // Attach keydown listener
  useEffect(() => {
    if (isMentioning && inputRef && inputRef.current) {
      const handleKeyDownEvent = (e) => handleKeyDown(e);
      inputRef.current.addEventListener('keydown', handleKeyDownEvent);
      
      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('keydown', handleKeyDownEvent);
        }
      };
    }
  }, [isMentioning, users, selectedIndex, inputRef]);

  // Scroll to selected item
  useEffect(() => {
    if (listRef.current && isMentioning) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex, isMentioning]);

  // Function to handle user selection
  const selectUser = (user) => {
    if (!user) return;
  
    console.log('Selecting user:', user);
  
    // Get the cursor position
    const cursorPosition = getCursorPosition();
    
    // Replace the mention query with the username
    const beforeMention = inputValue.substring(0, mentionIndex);
    const afterMention = inputValue.substring(cursorPosition);
    
    // Format: @username
    const mentionText = `@${user.username} `;
    
    const newValue = beforeMention + mentionText + afterMention;
    
    // Set flag to skip next check to prevent popup from reopening
    skipNextCheckRef.current = true;
    
    // First close the popup by setting these states
    setIsMentioning(false);
    setUsers([]);
  
    // Update the input value
    onInputChange(newValue);
    
    // Call the onMention callback with the mentioned user
    if (onMention) {
      onMention(user);
    }
    
    // Focus back on the input
    if (inputRef && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
        
        // Calculate new cursor position after the inserted mention
        const newCursorPosition = mentionIndex + mentionText.length;
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  // Define proper placement based on mention position
  const getPopperPlacement = () => {
    // Default to bottom-start if we can't determine position
    if (!mentionAnchorPosition) return 'bottom-start';
    
    // If near the bottom of the screen, show above
    const viewportHeight = window.innerHeight;
    const inputRect = inputRef?.current?.getBoundingClientRect();
    
    if (inputRect && (inputRect.bottom + 300) > viewportHeight) {
      return 'top-start';
    }
    
    return 'bottom-start';
  };

  // Create modifiers for popper positioning
  const getPopperModifiers = () => {
    if (!mentionAnchorPosition) return [];
    
    return [
      {
        name: 'offset',
        options: {
          offset: [mentionAnchorPosition.left, mentionAnchorPosition.top],
        },
      },
    ];
  };

  return (
    <Popper 
      open={isMentioning && users.length > 0} 
      anchorEl={anchorEl || inputRef?.current}
      placement={getPopperPlacement()}
      modifiers={getPopperModifiers()}
      style={{ zIndex: 1300, width: 300, maxHeight: 300, overflow: 'auto' }}
    >
      <ClickAwayListener onClickAway={() => setIsMentioning(false)}>
        <Paper elevation={3} sx={{ borderRadius: 1 }}>
          {loading ? (
            <MDBox display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} color="warning" />
            </MDBox>
          ) : (
            <MDBox ref={listRef}>
              {users.map((user, index) => (
                <MDBox
                  key={user.id || user.username}
                  data-index={index}
                  onClick={() => selectUser(user)}
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: index === selectedIndex ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    }
                  }}
                >
                  <MDAvatar
                    src={user.avatar || undefined}
                    alt={user.username}
                    size="sm"
                    sx={{ mr: 2 }}
                    bgColor="warning"
                  >
                    {user.username?.charAt(0).toUpperCase()}
                  </MDAvatar>
                  <MDBox>
                    <MDTypography variant="button" fontWeight="medium">
                      {user.username}
                    </MDTypography>
                    <MDTypography variant="caption" color="text" display="block">
                      {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'}
                    </MDTypography>
                  </MDBox>
                </MDBox>
              ))}
            </MDBox>
          )}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

export default UserMention;