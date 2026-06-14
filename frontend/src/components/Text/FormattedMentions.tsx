import React from 'react';
import MDTypography from 'components/MDTypography/MDTypography';
import { Box, Tooltip } from '@mui/material';

/**
 * Component that renders text with formatted mentions
 * 
 * Only applies special styling to @mentions without changing the overall text appearance.
 * 
 * @param {string} text - The text content to format
 * @param {string} variant - MDTypography variant
 * @param {string} color - MDTypography color
 * @param {object} props - Additional props to pass to MDTypography
 */
const FormattedMentions = ({ 
  text = '', 
  variant = 'body2', 
  color = 'text',
  ...props 
}: any) => {
  // If text is empty, return original component
  if (!text || text.trim() === '') {
    return <>{text}</>;
  }

  // Process text to find @mentions
  const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[.,!?;:])/g;
  let lastIndex = 0;
  const parts = [];
  let match;

  // Create a new regex instance to avoid issues with global flag
  const regex = new RegExp(mentionRegex);

  // Find all @mentions and split the text into parts
  while ((match = regex.exec(text)) !== null) {
    // Add the text before the mention
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

    // Add the mention without the @ symbol
    parts.push({
      type: 'mention',
      username: match[1]
    });

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  // If no mentions were found, just return the original text without any special component
  if (parts.length === 0) {
    return <>{text}</>;
  }

  // Otherwise, render the parts with only mentions specially formatted
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          // For regular text, just render it as is with no special formatting
          return <React.Fragment key={`text-${index}`}>{part.content}</React.Fragment>;
        } else if (part.type === 'mention') {
          // For mentions, render with special styling
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
                  display: 'inline',
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
        return null;
      })}
    </>
  );
};

export default FormattedMentions;