"use client";

import {
  X,
  MessageCircle,
  RefreshCw,
  Users,
  Zap,
  AlertTriangle,
  User,
  Wifi,
  WifiOff,
  Clock,
  Shield,
  Phone,
  FileText,
  Bell,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";

export function ChatInfoModal({ isOpen, onClose, otherUser }) {
  const { isDarkMode } = useTheme();
  const { isConnected, onlineUsers, isUserOnline } = useWebSocket();

  if (!isOpen) return null;

  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Send and receive messages instantly via WebSocket",
      status: "available",
    },
    // {
    //   icon: Wifi,
    //   title: "Live Connection Status",
    //   description: "See real-time connection and online user indicators",
    //   status: "available",
    // },
    // {
    //   icon: Clock,
    //   title: "Typing Indicators",
    //   description: "See when someone is typing a message",
    //   status: "available",
    // },
    // {
    //   icon: Users,
    //   title: "Online Status",
    //   description: "View who's currently online with green indicators",
    //   status: "available",
    // },
    {
      icon: RefreshCw,
      title: "Message History",
      description: "Access previous conversation history",
      status: "available",
    },
  ];

  const limitations = [
    {
      icon: Smartphone,
      title: "Mobile Responsiveness",
      description: "Interface not optimized for mobile devices yet",
      priority: "high",
    },
    {
      icon: Phone,
      title: "Voice/Video Calls",
      description: "Audio and video calling features not implemented",
      priority: "medium",
    },
    // {
    //   icon: FileText,
    //   title: "File Sharing",
    //   description: "Currently only text messages are supported",
    //   priority: "medium",
    // },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "No browser notifications for new messages",
      priority: "medium",
    },
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Messages are not encrypted end-to-end",
      priority: "low",
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "medium":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "low":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chat Settings
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>v2.4 - Real-time Edition</span>
                {/* <span>•</span> */}
                {/* <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Disconnected</span>
                    </>
                  )}
                </div> */}
                {/* <span>•</span> */}
                {/* <span>{onlineUsers.size} online</span> */}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Connection Status */}
          {otherUser && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  {isUserOnline(otherUser.id) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {otherUser.name || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isUserOnline(otherUser.id)
                      ? "Currently online"
                      : "Offline"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Available Features */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
              Available Features
            </h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <feature.icon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
              Current Limitations
            </h3>
            <div className="space-y-3">
              {limitations.map((limitation, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getPriorityColor(
                    limitation.priority
                  )}`}
                >
                  <limitation.icon
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      limitation.priority === "high"
                        ? "text-red-600 dark:text-red-400"
                        : limitation.priority === "medium"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {limitation.title}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          limitation.priority === "high"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : limitation.priority === "medium"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {limitation.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {limitation.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Notice */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start space-x-3">
              <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  📱 Mobile Experience Notice
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  This chat interface is currently optimized for desktop use.
                  We&apos;re actively working on mobile responsiveness improvements.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Development in progress...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Tips */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              Usage Tips
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    •
                  </span>
                  Messages are delivered in real-time via WebSocket connection
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    •
                  </span>
                  Green dots indicate when users are online and active
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    •
                  </span>
                  Typing indicators show when someone is composing a message
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    •
                  </span>
                  Use the search feature to quickly find conversations
                </li>
              </ul>
            </div>
          </div>

          {/* Contributor */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span>Developed by</span>
              <a
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                href="https://itersocialconnect.vercel.app/profile/EwButhIsHsqv4capcIkw"
                target="_blank"
                rel="noopener noreferrer"
              >
                mic-720
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
