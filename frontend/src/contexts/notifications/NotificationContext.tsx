/**
 * Notification Context with WebSocket Support
 *
 * Provides real-time notification delivery via WebSocket connection.
 * Falls back to REST API for mark-as-read operations when WebSocket is disconnected.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import notificationApi from "services/notificationApi";
import notificationWebSocket, {
  WebSocketMessage,
  Notification,
} from "services/websocketService";

// Types
interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  wsConnected: boolean;
}

type NotificationAction =
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_AS_READ"; payload: number }
  | { type: "MARK_ALL_READ" }
  | { type: "LOADING"; payload: boolean }
  | { type: "ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_WS_CONNECTED"; payload: boolean };

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => void;
  markAllRead: () => void;
  clearError: () => void;
}

type NotificationContextType = [
  NotificationState & { unreadCount: number },
  NotificationActions
];

// Context
const NotificationContext = createContext<NotificationContextType | null>(null);
NotificationContext.displayName = "NotificationContext";

// Reducer
function reducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
        loading: false,
        error: null,
      };
    case "ADD_NOTIFICATION": {
      // Check if notification already exists (prevent duplicates)
      const exists = state.notifications.some(
        (n) => n.id === action.payload.id
      );
      if (exists) return state;
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        loading: false,
        error: null,
      };
    }
    case "MARK_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, is_read: true } : n
        ),
      };
    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      };
    case "LOADING":
      return { ...state, loading: action.payload };
    case "ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "SET_WS_CONNECTED":
      return { ...state, wsConnected: action.payload };
    default:
      throw new Error(`Unhandled action type`);
  }
}

// Token getter (will be set by the provider)
let tokenGetter: (() => string | null) | null = null;

export function setNotificationTokenGetter(getter: () => string | null) {
  console.log('[NotificationContext] setNotificationTokenGetter called');
  tokenGetter = getter;
}

// Provider Component
function NotificationProvider({ children }: { children: ReactNode }) {
  const initialState: NotificationState = {
    notifications: [],
    loading: false,
    error: null,
    wsConnected: false,
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const wsInitialized = useRef(false);
  const fetchInProgressRef = useRef(false);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    // ... existing implementation ...
    switch (message.type) {
      case "connection_established":
        console.log("WebSocket notification connection established");
        dispatch({ type: "SET_WS_CONNECTED", payload: true });
        break;

      case "new_notification":
        console.log('[NotificationContext] Handling new_notification:', message.notification);
        if (message.notification) {
          dispatch({ type: "ADD_NOTIFICATION", payload: message.notification });
        }
        break;

      case "read_confirmation":
        if (message.success && message.notification_id !== undefined) {
          dispatch({ type: "MARK_AS_READ", payload: message.notification_id });
        }
        break;

      case "all_read_confirmation":
        if (message.success) {
          dispatch({ type: "MARK_ALL_READ" });
        }
        break;

      case "notification_read":
        // Sync from other tabs/devices
        if (message.notification_id !== undefined) {
          dispatch({ type: "MARK_AS_READ", payload: message.notification_id });
        }
        break;

      case "all_notifications_read":
        // Sync from other tabs/devices
        dispatch({ type: "MARK_ALL_READ" });
        break;

      case "error":
        console.error("WebSocket error:", message.message);
        break;

      default:
        break;
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Function to attempt connection
    const connect = () => {
      // Skip if already initialized or WebSocket is already connected
      if (wsInitialized.current || notificationWebSocket.isConnected()) {
        return;
      }

      const token = tokenGetter?.();

      if (!token) {
        // Token not available yet
        return;
      }

      console.log("[NotificationProvider] Token found, initializing WebSocket...");
      wsInitialized.current = true;

      notificationWebSocket.connect({
        onMessage: handleWebSocketMessage,
        onConnect: () => {
          dispatch({ type: "SET_WS_CONNECTED", payload: true });
        },
        onDisconnect: () => {
          dispatch({ type: "SET_WS_CONNECTED", payload: false });
        },
        getAccessToken: () => tokenGetter?.() ?? null,
        onAuthError: () => {
          console.error("WebSocket authentication failed");
          dispatch({ type: "SET_WS_CONNECTED", payload: false });
          wsInitialized.current = false;
        },
      });
    };

    // Initial attempt
    connect();

    // Poll until connected (handles race condition where AuthContext sets getter after we mount)
    const intervalId = setInterval(() => {
      if (!wsInitialized.current && !notificationWebSocket.isConnected()) {
        connect();
      } else {
        // Once initialized, clear the interval
        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      notificationWebSocket.disconnect();
      wsInitialized.current = false;
    };
  }, [handleWebSocketMessage]);

  // Reconnect when token changes
  useEffect(() => {
    if (!wsInitialized.current) return;

    const token = tokenGetter?.();
    if (token && !notificationWebSocket.isConnected()) {
      notificationWebSocket.updateToken();
    }
  }, []);

  // Fetch initial notifications via REST API
  const fetchNotifications = useCallback(async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      dispatch({ type: "LOADING", payload: true });
      const response = await notificationApi.getNotifications({ limit: 50 });
      dispatch({
        type: "SET_NOTIFICATIONS",
        payload: response?.results || [],
      });
    } catch (error) {
      dispatch({ type: "ERROR", payload: "Failed to fetch notifications" });
    } finally {
      fetchInProgressRef.current = false;
    }
  }, []);

  // Initial fetch on mount - wait for token
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds timeout (increased to be safe)
    
    const checkTokenAndFetch = () => {
      const token = tokenGetter?.();
      // If we have a token, fetch notifications
      if (token) {
        fetchNotifications();
        return true; 
      }
      return false;
    };

    // Try immediately
    if (!checkTokenAndFetch()) {
      // If not available, poll
      const intervalId = setInterval(() => {
        attempts++;
        if (checkTokenAndFetch() || attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchNotifications]);

  // Mark as read - prefer WebSocket, fallback to API
  const markAsRead = useCallback((notificationId: number) => {
    if (notificationWebSocket.isConnected()) {
      notificationWebSocket.markRead(notificationId);
      // Optimistically update UI
      dispatch({ type: "MARK_AS_READ", payload: notificationId });
    } else {
      // Fallback to REST API
      notificationApi
        .markNotificationRead(notificationId)
        .then(() => dispatch({ type: "MARK_AS_READ", payload: notificationId }))
        .catch((err) =>
          console.error("Error marking notification as read:", err)
        );
    }
  }, []);

  // Mark all as read - prefer WebSocket, fallback to API
  const markAllRead = useCallback(() => {
    if (notificationWebSocket.isConnected()) {
      notificationWebSocket.markAllRead();
      // Optimistically update UI
      dispatch({ type: "MARK_ALL_READ" });
    } else {
      // Fallback to REST API
      notificationApi
        .markAllRead()
        .then(() => dispatch({ type: "MARK_ALL_READ" }))
        .catch((err) =>
          console.error("Error marking all notifications as read:", err)
        );
    }
  }, []);

  // Computed values
  const unreadCount = state.notifications.filter((n) => !n.is_read).length;

  // Actions object
  const actions: NotificationActions = {
    fetchNotifications,
    markAsRead,
    markAllRead,
    clearError: () => dispatch({ type: "CLEAR_ERROR" }),
  };

  return (
    <NotificationContext.Provider value={[{ ...state, unreadCount }, actions]}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook
function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

export { NotificationProvider, useNotifications };
