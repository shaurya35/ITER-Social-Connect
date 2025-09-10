"use client";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEffect, useState } from "react";

export function WebSocketStatus() {
  const { isConnected, testConnection } = useWebSocket();
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/health`);
        const data = await response.json();
        setServerStatus(data);
      } catch (error) {
        setServerStatus({ status: "error", error: error.message });
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
        <span className="font-medium">WebSocket: {isConnected ? "Connected" : "Disconnected"}</span>
      </div>
      
      {serverStatus && (
        <div className="text-gray-600 dark:text-gray-400">
          <div>Server: {serverStatus.status}</div>
          {serverStatus.websocket && (
            <div>Clients: {serverStatus.websocket.connected}</div>
          )}
        </div>
      )}
      
      <button
        onClick={testConnection}
        className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Test Connection
      </button>
    </div>
  );
}
