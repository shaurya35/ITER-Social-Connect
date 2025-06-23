"use client";

import {
  X,
  MessageCircle,
  RefreshCw,
  Users,
  Zap,
  AlertTriangle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ChatInfoModal({ isOpen, onClose, otherUser }) {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Send and receive text messages instantly",
      status: "available",
    },
    {
      icon: RefreshCw,
      title: "Manual Refresh",
      description: "Click refresh button to get new messages",
      status: "available",
    },
    {
      icon: Zap,
      title: "Message History",
      description: "Access previous conversation history",
      status: "available",
    },
  ];

  const limitations = [
    {
      icon: AlertTriangle,
      title: "No Auto-Polling",
      description:
        "Messages don't update automatically - manual refresh required",
    },
    {
      icon: AlertTriangle,
      title: "No Voice/Video Calls",
      description: "Voice and video calling features are not yet implemented",
    },
    {
      icon: AlertTriangle,
      title: "No File Sharing",
      description: "Currently only text messages are supported",
    },
    {
      icon: AlertTriangle,
      title: "No Push Notifications",
      description: "No real-time notifications for new messages",
    },
    {
      icon: AlertTriangle,
      title: "No Message Encryption",
      description: "Messages are not end-to-end encrypted",
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close only if the background itself was clicked
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {" "}
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chat Information
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {otherUser?.name
                  ? `Conversation with ${otherUser.name}`
                  : "Chat Features & Limitations"}
              </p>
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
                  className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <limitation.icon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {limitation.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {limitation.description}
                    </p>
                  </div>
                </div>
              ))}
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
                  Click the refresh button regularly to check for new messages
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    •
                  </span>
                  Messages are stored and will persist between sessions
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">
                    •
                  </span>
                  Use the search feature in the sidebar to find conversations
                  quickly
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
                className="font-medium text-blue-600 dark:text-blue-400"
                href="https://itersocialconnect.vercel.app/profile/EwButhIsHsqv4capcIkw"
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
