import React from 'react';
import { createReactInlineContentSpec } from "@blocknote/react";
import searchApi from 'services/searchApi';
import { notifyMentionedUsers } from 'utilities/mentionUtils';

// Module-level variable to store page context
let currentPageContext = null;

// Function to set the current page context
export const setCurrentPageContext = (pageContext) => {
  currentPageContext = pageContext;
  // console.log("Page context set:", currentPageContext);
};

// The Mention inline content.
export const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      user: {
        default: "Unknown",
      },
      blockId: {
        default: null,
      },
      avatar: {
        default: null,
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span style={{ 
        backgroundColor: "#8400ff33", 
        display: "inline-flex", 
        alignItems: "center", 
        borderRadius: "4px", 
        padding: "2px 6px",
        gap: "6px"
      }}>
        {/* {props.inlineContent.props.avatar && (
          <img 
            src={props.inlineContent.props.avatar} 
            alt={props.inlineContent.props.user} 
            style={{ width: 16, height: 16, borderRadius: "50%" }}
          />
        )} */}
        @{props.inlineContent.props.user}
      </span>
    ),
  }
);


// Keep track of users who were already notified to prevent duplicate notifications
// Key format: "pageSlug:username" to allow same user to be notified on different pages
const notifiedUsers = new Map<string, number>(); // username -> timestamp

// Notification dedup window in milliseconds (5 minutes)
const NOTIFICATION_DEDUP_WINDOW = 5 * 60 * 1000;

// Function to check if user was recently notified
const wasRecentlyNotified = (username: string, pageSlug: string): boolean => {
  const key = `${pageSlug}:${username}`;
  const lastNotified = notifiedUsers.get(key);
  if (!lastNotified) return false;

  const timeSinceNotification = Date.now() - lastNotified;
  return timeSinceNotification < NOTIFICATION_DEDUP_WINDOW;
};

// Function to mark user as notified
const markAsNotified = (username: string, pageSlug: string): void => {
  const key = `${pageSlug}:${username}`;
  notifiedUsers.set(key, Date.now());
};

// Export function to clear notifications for a specific page (call on page save/navigate)
export const clearNotifiedUsersForPage = (pageSlug: string): void => {
  const keysToDelete: string[] = [];
  notifiedUsers.forEach((_, key) => {
    if (key.startsWith(`${pageSlug}:`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => notifiedUsers.delete(key));
  console.log(`[Mentions] Cleared notification cache for page: ${pageSlug}`);
};

// Export function to clear all notifications (call on logout or major state changes)
export const clearAllNotifiedUsers = (): void => {
  notifiedUsers.clear();
  console.log('[Mentions] Cleared all notification cache');
};

// Function which gets all users for the mentions menu.
export const getMentionMenuItems = async (editor, query, contextProvider) => {
  console.log('[Mentions] getMentionMenuItems called with query:', query);

  try {
    // Use your existing searchApi for consistency
    console.log('[Mentions] Fetching users from search API...');
    const users = await searchApi.searchUsers(query, { limit: 10 });
    console.log('[Mentions] Search API returned users:', users);
    
    // Transform users into the format expected by BlockNote suggestion menu
    return users.map((user) => ({
      title: user.username,
      subtitle: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
      icon: user.avatar
      ? () => (
          <img
            src={user.avatar}
            alt={user.username}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              // fallback to initials or hide
              e.currentTarget.style.display = 'none';
            }}
          />
        )
      : user.username[0]?.toUpperCase(), // fallback to first initial
      onItemClick: () => {
        // Get current block ID directly from editor
        let currentBlockId = null;
        
        // Method 1: Try to get it from context provider if available
        if (contextProvider && typeof contextProvider.getCurrentBlock === 'function') {
          currentBlockId = contextProvider.getCurrentBlock();
          console.log("Got block ID from context provider:", currentBlockId);
        }
        
        // Method 2: Try to get it from selection
        if (!currentBlockId) {
          try {
            const selection = editor.getSelection();
            if (selection && selection.blocks && selection.blocks.length > 0) {
              currentBlockId = selection.blocks[0].id;
              console.log("Got block ID from selection:", currentBlockId);
            }
          } catch (err) {
            console.error("Error getting selection:", err);
          }
        }
        
        // Method 3: Try to find block ID from DOM
        if (!currentBlockId) {
          currentBlockId = findBlockIdFromDOM();
          if (currentBlockId) {
            console.log("Got block ID from DOM:", currentBlockId);
          }
        }
        
        console.log("Final block ID:", currentBlockId);
        
        // Insert the mention with block ID
        editor.insertInlineContent([
          {
            type: "mention",
            props: {
              user: user.username,
              blockId: currentBlockId,
              avatar: user.avatar, // <-- pass avatar here
            },
          },
          " ", // add a space after the mention
        ]);
        
        // Get page context first (needed for dedup check)
        const pageContext = getPageContext(contextProvider);
        const pageSlug = pageContext.slug || 'unknown';

        console.log('[Mentions] User selected:', user.username);
        console.log('[Mentions] Page context:', pageContext);
        console.log('[Mentions] Block ID:', currentBlockId);

        // Check if we've recently notified this user on this page (5 min window)
        // if (wasRecentlyNotified(user.username, pageSlug)) {
        //   console.log(`[Mentions] User ${user.username} was recently notified on page ${pageSlug}, skipping duplicate`);
        //   return;
        // }

        // Mark user as notified for this page
        markAsNotified(user.username, pageSlug);

        // Create notification context
        const notificationContext = {
          sourceType: 'block',
          pageSlug: pageContext.slug,
          pageId: pageContext.id,
          pageTitle: pageContext.title,
          mentionerUsername: localStorage.getItem('username') || 'User',
          pageContext: {
            title: pageContext.title
          },
          blockId: currentBlockId,
        };

        console.log('[Mentions] Sending notification with context:', notificationContext);

        // Send notification
        notifyMentionedUsers(`@${user.username}`, notificationContext)
          .then(result => {
            console.log('[Mentions] Notification sent successfully:', result);
          })
          .catch(error => {
            console.error('[Mentions] Error sending notification:', error);
            // Remove from notified set so user can retry
            const key = `${pageSlug}:${user.username}`;
            notifiedUsers.delete(key);
          });
      },
    }));
  } catch (error) {
    console.error('Error fetching users for mention:', error);
    return [];
  }
};

// Helper function to find block ID from DOM
const findBlockIdFromDOM = () => {
  try {
    // Get selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    // Get the node where the cursor is
    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    
    // Function to check if a node has data-id
    const hasDataId = (node) => node && node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-id');
    
    // Walk up the DOM to find a node with data-id
    while (node && node !== document.body) {
      if (hasDataId(node)) {
        return (node as Element).getAttribute('data-id');
      }
      
      // Special case for BlockNote - sometimes blocks have a specific structure
      const blockElement = (node as Element).closest ? (node as Element).closest('[data-id]') : null;
      if (blockElement) {
        return blockElement.getAttribute('data-id');
      }
      
      node = node.parentNode;
    }
    
    // If we couldn't find it directly, try other strategies
    // Look for all block elements in the editor and find the one closest to the cursor
    const editorElement = document.querySelector('.blocknote-editor');
    if (editorElement) {
      const blockElements = editorElement.querySelectorAll('[data-id]');
      let closestBlock = null;
      let minDistance = Infinity;
      
      blockElements.forEach(blockEl => {
        const rect = blockEl.getBoundingClientRect();
        const selectionRect = range.getBoundingClientRect();
        
        // Simple distance calculation
        const distance = Math.abs(rect.top - selectionRect.top);
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = blockEl;
        }
      });
      
      if (closestBlock) {
        return closestBlock.getAttribute('data-id');
      }
    }
  } catch (err) {
    console.error("Error finding block ID from DOM:", err);
  }
  
  return null;
};

// Helper function to get page context
const getPageContext = (contextProvider) => {
  // Try to get from context provider first
  if (contextProvider && typeof contextProvider.getPageContext === 'function') {
    const context = contextProvider.getPageContext();
    if (context) {
      return context;
    }
  }
  
  // Fall back to global context
  if (currentPageContext) {
    return currentPageContext;
  }
  
  // Otherwise try to extract from DOM
  return getPageInfoFromDom();
};

// Helper function to get page info from DOM
// This extracts page information from URL or data attributes in the DOM
const getPageInfoFromDom = () => {
  // Default values
  const pageInfo = {
    id: '',
    slug: '',
    title: 'Page'
  };
  
  try {
    // Check for data attributes first (more reliable)
    const pageElement = document.querySelector('[data-page-id]');
    if (pageElement) {
      pageInfo.id = pageElement.getAttribute('data-page-id');
      if (pageElement.hasAttribute('data-page-slug')) {
        pageInfo.slug = pageElement.getAttribute('data-page-slug');
      }
    }
    
    // If no slug from data attribute, try URL
    if (!pageInfo.slug) {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/pages\/([^/]+)/);
      if (match && match[1]) {
        pageInfo.slug = match[1];
      }
    }
    
    // Try to get page title from document title
    const docTitle = document.title;
    if (docTitle) {
      pageInfo.title = docTitle.replace(' | Your App Name', ''); // Adjust as needed
    }
    
    // If page ID is not found, generate one from the slug
    if (!pageInfo.id && pageInfo.slug) {
      pageInfo.id = `page-${pageInfo.slug}`;
    }
  } catch (error) {
    console.error('Error getting page info from DOM:', error);
  }
  
  return pageInfo;
};

// Export function to handle manual notification processing on save
export const processAllMentionsInEditor = async (editor, pageContext) => {
  if (!editor) return { success: false, message: 'No editor available' };
  
  // Get all mentions from entire document with their block IDs
  const mentionsWithBlocks = [];
  
  editor.forEachBlock((block) => {
    const blockId = block.id;
    const inlineContent = block.content;
    
    if (inlineContent) {
      inlineContent.forEach(item => {
        if (item.type === "mention" && item.props.user) {
          mentionsWithBlocks.push({
            username: item.props.user,
            blockId: item.props.blockId || blockId  // Use stored blockId or fallback to containing block
          });
        }
      });
    }
    return true;
  });
  
  // If no mentions, return early
  if (mentionsWithBlocks.length === 0) {
    return { success: true, message: 'No mentions found' };
  }
  
  // Use page context if provided, otherwise try to get from DOM
  const context = pageContext || currentPageContext || getPageInfoFromDom();
  
  // Group mentions by username to avoid duplicate notifications
  const mentionsByUser = {};
  
  mentionsWithBlocks.forEach(mention => {
    if (!mentionsByUser[mention.username]) {
      mentionsByUser[mention.username] = [mention.blockId];
    } else if (mention.blockId && !mentionsByUser[mention.username].includes(mention.blockId)) {
      mentionsByUser[mention.username].push(mention.blockId);
    }
  });
  
  // Process each user individually with their block IDs
  const results = await Promise.all(
    Object.entries(mentionsByUser).map(async ([username, blockIds]) => {
      const notificationContext = {
        sourceType: 'block',
        pageSlug: context.slug,
        pageId: context.id,
        pageTitle: context.title,
        mentionerUsername: localStorage.getItem('username') || 'User',
        pageContext: {
          title: context.title
        },
        blockId: blockIds[0] // Use the first block ID for the notification
      };
      
      try {
        return await notifyMentionedUsers(`@${username}`, notificationContext);
      } catch (error) {
        console.error(`Error sending mention notification to ${username}:`, error);
        return { success: false, error: error.message, username };
      }
    })
  );
  
  // Determine overall success
  const successCount = results.filter(r => r.success).length;
  
  if (successCount === results.length) {
    return { 
      success: true, 
      message: `Notifications sent to ${successCount} users`,
      mentions: Object.keys(mentionsByUser)
    };
  } else {
    return {
      success: false,
      message: `${successCount} of ${results.length} notifications sent successfully`,
      mentions: Object.keys(mentionsByUser)
    };
  }
};