import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem,
  Divider, 
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CheckIcon from '@mui/icons-material/Check';
import LaunchIcon from '@mui/icons-material/Launch';
import { formatDistanceToNow } from 'date-fns';

// Import our notification context
import { useNotifications } from 'contexts/notifications/NotificationContext';

// Import MDComponents
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';
import MDButton from "components/MDButton/MDButton";

const severityColorMap = {
  info: 'info',
  warning: 'warning',
  danger: 'error',
  success: 'success'
};

const NotificationIcon = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [notificationState, notificationActions] = useNotifications();
  const { notifications, loading, unreadCount } = notificationState;

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    await notificationActions.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await notificationActions.markAllRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Parse the message field to extract navigation URL if available
  const parseMessageData = (message) => {
    try {
      // Check if the message is in JSON format
      const data = JSON.parse(message);
      return {
        displayMessage: data.message || message,
        navigateUrl: data.navigate_url || null
      };
    } catch (error) {
      // If not JSON or can't be parsed, just use the message as is
      return {
        displayMessage: message,
        navigateUrl: null
      };
    }
  };

  // Handle clicking on a notification
  const handleNotificationClick = (notification) => {
    // Mark as read first if unread
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Parse the message to check for navigation URL
    const { navigateUrl } = parseMessageData(notification.message);
    
    // Close the menu
    handleCloseMenu();

    // Navigate if a URL is available
    if (navigateUrl) {
      // For absolute URLs (external) use window.open
      if (navigateUrl.startsWith('http')) {
        window.open(navigateUrl, '_blank');
      } else {
        // For relative URLs (internal) use navigate
        navigate(navigateUrl);
      }
    }
  };

  // Format time as relative (e.g., "2 hours ago")
  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleOpenMenu}
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { 
            width: 380, 
            maxHeight: 500,
            overflow: 'hidden', // Hide scroll on the paper itself, handle in List
            mt: 1.5,
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.05)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header Section */}
        <MDBox 
          px={2.5} 
          py={2} 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          borderBottom="1px solid rgba(0,0,0,0.06)"
          bgcolor="#fcfcfc"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <MDTypography variant="h6" fontWeight="bold" color="text">
              Notifications
            </MDTypography>
            {unreadCount > 0 && (
              <Box 
                bgcolor="error.main" 
                color="white" 
                borderRadius="6px" 
                px={1} 
                py={0.25} 
                display="flex" 
                alignItems="center"
              >
                <MDTypography variant="caption" fontWeight="bold" color="white" lineHeight={1}>
                  {unreadCount} New
                </MDTypography>
              </Box>
            )}
          </Box>
          
          {unreadCount > 0 && (
            <MDButton 
              variant="text" 
              color="info"
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              startIcon={!markingAllRead && <MarkEmailReadIcon />}
              sx={{ 
                textTransform: 'none', 
                fontSize: '0.75rem',
                minHeight: 0,
                p: '4px 8px'
              }}
            >
              {markingAllRead ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                'Mark all read'
              )}
            </MDButton>
          )}
        </MDBox>
        
        {/* Notifications List */}
        <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          {!loading && notifications.length === 0 && (
            <Box 
              p={4} 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              textAlign="center"
            >
              <Avatar sx={{ bgcolor: 'grey.100', width: 56, height: 56, mb: 2 }}>
                <NotificationsIcon color="disabled" sx={{ fontSize: 32 }} />
              </Avatar>
              <MDTypography variant="button" fontWeight="medium" color="text">
                No notifications
              </MDTypography>
              <MDTypography variant="caption" color="secondary" mt={0.5}>
                You're all caught up! Check back later.
              </MDTypography>
            </Box>
          )}
          
          <List sx={{ width: '100%', p: 0 }}>
            {notifications.map((notification) => {
              const isUnread = !notification.is_read;
              const severityColor = severityColorMap[notification.severity] || 'info';
              const { displayMessage, navigateUrl } = parseMessageData(notification.message);
              
              return (
                <ListItem
                  key={notification.id}
                  alignItems="flex-start"
                  disablePadding
                  sx={{
                    transition: 'background-color 0.2s',
                    backgroundColor: isUnread ? 'rgba(56, 142, 60, 0.04)' : 'transparent', // Very subtle green/theme tint for unread
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    '&:hover': {
                      backgroundColor: isUnread ? 'rgba(56, 142, 60, 0.08)' : 'rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  <Box 
                    sx={{ 
                      width: '100%', 
                      display: 'flex', 
                      p: 2, 
                      cursor: navigateUrl ? 'pointer' : 'default' 
                    }}
                    onClick={navigateUrl ? () => handleNotificationClick(notification) : undefined}
                  >
                    {/* Avatar */}
                    <ListItemAvatar sx={{ minWidth: 50, mt: 0.5 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: isUnread ? `${severityColor}.main` : 'grey.300',
                          width: 36, 
                          height: 36 
                        }}
                      >
                        <NotificationsIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    
                    {/* Content */}
                    <Box flexGrow={1} mr={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <MDTypography 
                          variant="button" 
                          fontWeight={isUnread ? "bold" : "medium"}
                          color="text"
                          textTransform="none"
                          sx={{ lineHeight: 1.3, mb: 0.5, display: 'block' }}
                        >
                          {notification.header || 'Notification'}
                        </MDTypography>
                        
                        {/* Time - Absolute positioning or flex item */}
                        <MDTypography 
                          variant="caption" 
                          color="secondary" 
                          sx={{ 
                            fontSize: '0.65rem', 
                            whiteSpace: 'nowrap', 
                            ml: 1,
                            mt: 0.2
                          }}
                        >
                          {formatTime(notification.sent_at)}
                        </MDTypography>
                      </Box>
                      
                      <MDTypography 
                        variant="caption" 
                        color="text" 
                        fontWeight="regular"
                        sx={{ 
                          display: 'block', 
                          lineHeight: 1.4,
                          color: isUnread ? 'text.main' : 'text.secondary'
                        }}
                      >
                        {displayMessage}
                      </MDTypography>
                    </Box>

                    {/* Actions Column */}
                    <Box display="flex" flexDirection="column" alignItems="center" ml={1}>
                      {isUnread && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            sx={{ 
                              color: 'text.secondary',
                              '&:hover': { color: 'success.main', bgcolor: 'success.transparent' }
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {navigateUrl && !isUnread && (
                         <Tooltip title="Open">
                            <IconButton 
                              size="small" 
                              sx={{ color: 'text.disabled' }}
                            >
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                         </Tooltip>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </Box>
        
        {/* Footer Link (Optional, kept commented or minimal) */}
        {/* <Box p={1} borderTop="1px solid rgba(0,0,0,0.06)" textAlign="center" bgcolor="#fcfcfc">
          <MDButton variant="text" color="primary" size="small" fullWidth>
            View all notifications
          </MDButton>
        </Box> */}
      </Menu>
    </>
  );
};

export default NotificationIcon;