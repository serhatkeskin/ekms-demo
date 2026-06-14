/**
 * WebSocket Service for Real-time Notifications
 *
 * Provides a singleton WebSocket connection manager for notification delivery.
 * Features:
 * - JWT authentication via query parameter
 * - Automatic reconnection with exponential backoff
 * - Ping/pong heartbeat to keep connection alive
 * - Type-safe message handling
 */

import { SOCKET_BASE } from "./base";

export type WebSocketMessageType =
  | "connection_established"
  | "new_notification"
  | "read_confirmation"
  | "all_read_confirmation"
  | "notification_read"
  | "all_notifications_read"
  | "unread_count"
  | "pong"
  | "error";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  notification?: Notification;
  notification_id?: number;
  notifications_updated?: number;
  count?: number;
  success?: boolean;
  message?: string;
  user_id?: number;
  username?: string;
  timestamp?: number;
}

export interface Notification {
  id: number;
  header?: string;
  message?: string;
  severity?: "info" | "warning" | "error" | "success";
  sent_at?: string;
  is_read?: boolean;
  unique_id?: string;
}

export interface NotificationWebSocketConfig {
  onMessage: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  getAccessToken: () => string | null;
  onAuthError?: () => void;
}

class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private config: NotificationWebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isIntentionalClose = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private tokenRetryTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  /**
   * Connect to the WebSocket server
   */
  connect(config: NotificationWebSocketConfig): void {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.isConnected()) {
      console.log("[WebSocket] Already connecting or connected, skipping");
      return;
    }

    // Clean up any existing connection/timeouts before starting fresh
    this.cleanup();

    this.config = config;
    this.isIntentionalClose = false;
    this.reconnectAttempts = 0;
    this.createConnection();
  }

  private createConnection(): void {
    if (!this.config) return;

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log("[WebSocket] Connection already in progress, skipping");
      return;
    }

    const token = this.config.getAccessToken();
    if (!token) {
      console.warn("No access token available for WebSocket connection");
      // Clear any existing token retry timeout before setting a new one
      if (this.tokenRetryTimeout) {
        clearTimeout(this.tokenRetryTimeout);
      }
      this.tokenRetryTimeout = setTimeout(() => this.createConnection(), 2000);
      return;
    }

    // Clean up any existing connection
    this.cleanup();
    this.isConnecting = true;

    const wsUrl = `${SOCKET_BASE}/notifications/?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws || !this.config) return;

    this.ws.onopen = () => {
      console.log("WebSocket connected to notification service");
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startPingInterval();
      this.config?.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('[WebSocketService] Received message:', message);
        this.config?.onMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      this.isConnecting = false;
      this.stopPingInterval();
      this.config?.onDisconnect?.(event);

      // Handle authentication errors (4001 = Unauthorized)
      if (event.code === 4001) {
        console.error("WebSocket authentication failed");
        this.config?.onAuthError?.();
        return;
      }

      // Attempt reconnection if not intentionally closed
      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.isConnecting = false;
      this.config?.onError?.(error);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max WebSocket reconnection attempts reached");
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(
      `Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.createConnection();
    }, delay);
  }

  private startPingInterval(): void {
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping", timestamp: Date.now() });
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private cleanup(): void {
    this.stopPingInterval();
    this.isConnecting = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.tokenRetryTimeout) {
      clearTimeout(this.tokenRetryTimeout);
      this.tokenRetryTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  /**
   * Send a message through the WebSocket connection
   */
  send(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }

  /**
   * Mark a notification as read via WebSocket
   */
  markRead(notificationId: number): void {
    this.send({ type: "mark_read", notification_id: notificationId });
  }

  /**
   * Mark all notifications as read via WebSocket
   */
  markAllRead(): void {
    this.send({ type: "mark_all_read" });
  }

  /**
   * Request current unread count
   */
  getUnreadCount(): void {
    this.send({ type: "get_unread_count" });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.cleanup();
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Update token and reconnect (call after token refresh)
   */
  updateToken(): void {
    if (this.isConnected()) {
      this.disconnect();
    }
    this.isIntentionalClose = false;
    this.reconnectAttempts = 0;
    this.createConnection();
  }

  /**
   * Reset reconnection attempts (call after successful manual reconnect)
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }
}

// Singleton instance
export const notificationWebSocket = new NotificationWebSocketService();
export default notificationWebSocket;
