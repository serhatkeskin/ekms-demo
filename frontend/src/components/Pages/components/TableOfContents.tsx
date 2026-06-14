// src/components/Pages/components/TableOfContents.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Collapse, IconButton, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TocIcon from '@mui/icons-material/Toc';
import MDBox from "components/MDBox/MDBox";
import MDTypography from "components/MDTypography/MDTypography";

/**
 * Table of Contents component that analyzes headers from BlockNote editor
 * and creates a clickable navigation structure
 */
const TableOfContents = ({ editor, title }: any) => {
  const [open, setOpen] = useState(true);
  const [tocItems, setTocItems] = useState([]);
  const [initialized, setInitialized] = useState(false);


  // Generate TOC data from blocks
  useEffect(() => {
    if (!editor) return;

    // Function to extract headings from editor
    const extractHeadings = () => {
      const headings = [];
      
      // Traverse all blocks in the editor
      editor.forEachBlock((block) => {
        // Check if block is a heading
        if (block.type === 'heading') {
          // Get heading properties
          const level = block.props.level || 1;
          const textContent = getTextContentFromBlock(block);
          
          if (textContent.trim()) {
            headings.push({
              id: block.id,
              level,
              text: textContent.trim(),
            });
          }
        }
        return true; // Continue traversal
      });
      
      return headings;
    };

    // Function to get text content from a block
    const getTextContentFromBlock = (block) => {
      if (!block.content) return '';
      
      // Extract text from content array
      return block.content.reduce((text, item) => {
        if (typeof item === 'string') {
          return text + item;
        } else if (item.text) {
          return text + item.text;
        }
        return text;
      }, '');
    };

    // Update TOC when editor changes
    const updateTOC = () => {
      const headings = extractHeadings();
      setTocItems(headings);
      setInitialized(true);
    };

    // Add onChange handler to editor
    const handleEditorChange = () => {
      updateTOC();
    };

    // Initial TOC generation
    updateTOC();

    // Add change listener to editor
    editor.onEditorContentChange(handleEditorChange);

    // Clean up listener when component unmounts
    return () => {
      // Remove change listener if editor has a cleanup method
      if (editor && editor.offEditorContentChange) {
        editor.offEditorContentChange(handleEditorChange);
      }
    };
  }, [editor]);

  // Navigate to a heading when clicked
  const scrollToHeading = (id) => {
    if (!id) return;
    
    try {
      // 1. Try using editor's selectBlock API if available
      if (editor && typeof editor.selectBlock === 'function') {
        editor.selectBlock(id);
      }
      
      // 2. Find the block element by data-id attribute
      const blockElement = document.querySelector(`[data-id="${id}"]`);
      
      if (blockElement) {
        // 3. Get all possible scroll containers to ensure compatibility
        const containers = [
          document.querySelector('.blocknote-editor-container'),
          document.querySelector('.page-content'),
          document.documentElement
        ].filter(Boolean);
        
        // 4. Calculate the element's position
        const rect = blockElement.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const absoluteTop = rect.top + scrollY;
        
        // 5. Add visual highlight effect to the target heading
        blockElement.classList.add('toc-highlight');
        setTimeout(() => {
          blockElement.classList.remove('toc-highlight');
        }, 2000);
        
        // 6. Try to scroll multiple possible containers
        for (const container of containers) {
          try {
            container.scrollTo({
              top: absoluteTop - 100, // Offset for navbar
              behavior: 'smooth'
            });
          } catch (error) {
            console.error("Error scrolling container:", error);
          }
        }
        
        // 7. Also try window scrolling as a fallback
        window.scrollTo({
          top: absoluteTop - 100,
          behavior: 'smooth'
        });
        
        // 8. Update URL with fragment for bookmarking and sharing
        window.history.pushState(null, '', `#${id}`);
        
        // 9. Set focus to the heading for accessibility
        blockElement.setAttribute('tabindex', '-1');
        (blockElement as HTMLElement).focus();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error navigating to heading:", error);
      return false;
    }
  };

  // If no headings and initialized, don't render anything
  if (initialized && tocItems.length === 0) {
    return null;
  }

  return (
    <MDBox mb={4} mt={2}>
      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        <MDBox
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          bgcolor="info.light"
          borderRadius="4px 4px 0 0"
          onClick={() => setOpen(!open)}
          sx={{ cursor: 'pointer' }}
        >
          <MDBox display="flex" alignItems="center">
            <TocIcon sx={{ mr: 1 }} />
            <MDTypography variant="h6" fontWeight="medium">
              Table of Contents
            </MDTypography>
          </MDBox>
          <IconButton
            aria-label="expand"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </MDBox>
        
        <Collapse in={open} timeout="auto">
          <MDBox p={2} pt={0} pb={1}>
            <List component="nav" dense disablePadding>
              {tocItems.map((item, index) => (
                <ListItem
                  button
                  key={`${item.id}-${index}`}
                  onClick={() => scrollToHeading(item.id)}
                  sx={{
                    pl: item.level * 1.5,
                    py: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <MDTypography
                        variant={item.level === 1 ? "body1" : "body2"}
                        fontWeight={item.level === 1 ? "medium" : "regular"}
                        sx={{ 
                          color: item.level === 1 ? 'text.primary' : 'text.secondary',
                          fontSize: 14 - (item.level - 1) * 0.5
                        }}
                      >
                        {item.text}
                      </MDTypography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </MDBox>
        </Collapse>
      </Paper>
    </MDBox>
  );
};

TableOfContents.propTypes = {
  editor: PropTypes.object.isRequired,
  title: PropTypes.string,
  onNavigate: PropTypes.func

};

export default TableOfContents;