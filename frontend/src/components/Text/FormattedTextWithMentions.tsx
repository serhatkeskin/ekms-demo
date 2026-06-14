// src/components/Text/FormattedTextWithMentions.js
import React from 'react';
import { Box, Tooltip } from '@mui/material';
import MDTypography from 'components/MDTypography/MDTypography';

/**
 * Component to display text with formatted mentions
 */
function FormattedTextWithMentions({ text, variant = "body2", color = "text", sx = {} }: any) {
  if (!text) return null;
  
  // Regular expression to match @username pattern
  const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[.,!?;:])/g;
  
  // Split text by mentions
  const parts = [];
  let lastIndex = 0;
  let match;
  
  // Create a copy of the regex for each execution to avoid issues with global flag
  const regex = new RegExp(mentionRegex);
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add a space if the match started with one
    if (match[0].startsWith(' ')) {
      parts.push({
        type: 'text',
        content: ' '
      });
    }
    
    // Add the mention (without the @ symbol)
    parts.push({
      type: 'mention',
      username: match[1]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  // If no mentions found, just return the text
  if (parts.length === 0) {
    return (
      <MDTypography variant={variant} color={color} sx={sx}>
        {text}
      </MDTypography>
    );
  }
  
  return (
    <MDTypography variant={variant} color={color} sx={sx}>
      {parts.map((part, index) => {
        if (part.type === 'mention') {
          return (
            <Tooltip 
              key={`mention-${index}`} 
              title={`@${part.username}`} 
              arrow
            >
              <Box
                component="span"
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  color: 'warning.main',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  fontWeight: 'medium',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  }
                }}
              >
                @{part.username}
              </Box>
            </Tooltip>
          );
        }
        return <span key={`text-${index}`}>{part.content}</span>;
      })}
    </MDTypography>
  );
}

export default FormattedTextWithMentions;