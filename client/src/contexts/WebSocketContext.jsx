"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthProvider";

const WebSocketContext = createContext(null);
const socket = new WebSocket(process.env.NEXT_PUBLIC_BACKENDWS_URL);


export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export function WebSocketProvider({ children }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messageHandlers = useRef(new Map());
  const typingTimeouts = useRef(new Map());
  const connectionAttemptRef = useRef(false);
  const pingIntervalRef = useRef(null);

  // WebSocket URL
  const WS_URL = 
    process.env.NODE_ENV === "production"
      ? `${process.env.NEXT_PUBLIC_BACKENDWS_URL}`
      : `${process.env.NEXT_PUBLIC_BACKENDWS_URL}`;

  // const WS_URL =
  // process.env.NODE_ENV === "production"
  //   ? `wss://${process.env.NEXT_PUBLIC_BACKENDWS_URL}`
  //   : `ws://${process.env.NEXT_PUBLIC_BACKENDWS_URL}`;


  const connect = useCallback(() => {
    if (!user?.id) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (connectionAttemptRef.current) {
      return;
    }

    connectionAttemptRef.current = true;

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      wsRef.current = new WebSocket(WS_URL);

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          console.error("⏰ WebSocket connection timeout");
          wsRef.current.close();
          connectionAttemptRef.current = false;
        }
      }, 10000);

      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        connectionAttemptRef.current = false;

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000); // Ping every 25 seconds

        // Join WebSocket with user info
        const joinMessage = {
          type: "join",
          userId: user.id,
          userInfo: {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
        };

        wsRef.current.send(JSON.stringify(joinMessage));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        connectionAttemptRef.current = false;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not a normal closure and user still exists
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts &&
          user?.id
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        connectionAttemptRef.current = false;

        // Only log meaningful errors
        if (wsRef.current?.readyState !== WebSocket.CLOSED) {
          console.warn("⚠️ WebSocket error - State:", {
            readyState: wsRef.current?.readyState,
            url: WS_URL,
            timestamp: new Date().toISOString(),
          });
        }
      };
    } catch (error) {
      connectionAttemptRef.current = false;
      console.error("❌ Failed to create WebSocket connection:", {
        error: error.message,
        url: WS_URL,
      });
    }
  }, [user, WS_URL]);

  const disconnect = useCallback(() => {
    connectionAttemptRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    setIsConnected(false);
    setOnlineUsers(new Set());
    setTypingUsers(new Map());
  }, []);

  const handleMessage = useCallback(
    (data) => {
      switch (data.type) {
        case "connected":
        case "joined":
          break;

        case "pong":
          // Handle pong response
          break;

        case "new_message":
          // Broadcast to message handlers
          messageHandlers.current.forEach((handler) => {
            handler(data);
          });
          break;

        case "user_online":
          if (data.userId !== user?.id) {
            setOnlineUsers((prev) => new Set([...prev, data.userId]));
          }
          break;

        case "user_offline":
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
          break;

        case "typing_start":
          if (data.userId !== user?.id) {
            setTypingUsers((prev) => {
              const newMap = new Map(prev);
              if (!newMap.has(data.conversationId)) {
                newMap.set(data.conversationId, new Set());
              }
              newMap.get(data.conversationId).add(data.userId);
              return newMap;
            });
          }
          break;

        case "typing_stop":
          if (data.userId !== user?.id) {
            setTypingUsers((prev) => {
              const newMap = new Map(prev);
              if (newMap.has(data.conversationId)) {
                newMap.get(data.conversationId).delete(data.userId);
                if (newMap.get(data.conversationId).size === 0) {
                  newMap.delete(data.conversationId);
                }
              }
              return newMap;
            });
          }
          break;

        // default:
        //   console.log("❓ Unknown WebSocket message type:", data.type);
      }
    },
    [user?.id]
  );

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn("⚠️ WebSocket not connected, cannot send message");
    return false;
  }, []);

  // Join a conversation room
  const joinConversation = useCallback(
    (conversationId) => {
      sendMessage({
        type: "join_conversation",
        conversationId,
      });
    },
    [sendMessage]
  );

  // Send typing indicators
  const startTyping = useCallback(
    (conversationId) => {
      sendMessage({
        type: "typing_start",
        conversationId,
      });
    },
    [sendMessage]
  );

  const stopTyping = useCallback(
    (conversationId) => {
      sendMessage({
        type: "typing_stop",
        conversationId,
      });
    },
    [sendMessage]
  );

  // Debounced typing handler
  const handleTyping = useCallback(
    (conversationId) => {
      // Clear existing timeout
      if (typingTimeouts.current.has(conversationId)) {
        clearTimeout(typingTimeouts.current.get(conversationId));
      }

      // Start typing
      startTyping(conversationId);

      // Set timeout to stop typing
      const timeout = setTimeout(() => {
        stopTyping(conversationId);
        typingTimeouts.current.delete(conversationId);
      }, 2000);

      typingTimeouts.current.set(conversationId, timeout);
    },
    [startTyping, stopTyping]
  );

  // Register message handler
  const onMessage = useCallback((handler) => {
    const id = Date.now() + Math.random();
    messageHandlers.current.set(id, handler);

    return () => {
      messageHandlers.current.delete(id);
    };
  }, []);

  // Check if user is online
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  // Get typing users for a conversation
  const getTypingUsers = useCallback(
    (conversationId) => {
      return typingUsers.get(conversationId) || new Set();
    },
    [typingUsers]
  );

  // Test connection function
  const testConnection = useCallback(() => {
    // fetch("http://localhost:8080/api/health")
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/health`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log("🏥 Backend health data:", data);
      })
      .catch((error) => {
        console.error("❌ Backend health check failed:", error);
      });
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (user?.id) {
      const connectTimeout = setTimeout(() => {
        connect();
      }, 1000);

      return () => {
        clearTimeout(connectTimeout);
      };
    }
  }, [user?.id, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all typing timeouts
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.current.clear();

      disconnect();
    };
  }, [disconnect]);

  const value = {
    isConnected,
    onlineUsers,
    sendMessage,
    joinConversation,
    handleTyping,
    startTyping,
    stopTyping,
    onMessage,
    isUserOnline,
    getTypingUsers,
    connect,
    disconnect,
    testConnection,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
