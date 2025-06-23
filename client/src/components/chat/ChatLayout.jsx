"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { useTheme } from "@/contexts/ThemeContext";

export function ChatLayout({ currentUser, targetUserId, targetUserName }) {
  const hasInitialized = useRef(false); // ✅ Only allow the effect to run once
  // const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/conversations", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        return data;
      } else {
        console.error("Failed to fetch conversations:", response.status);
        return [];
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const response = await fetch(`/api/chat/messages/${conversationId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const messagesData = data.messages || [];
        const userInfoData = data.userInfo || {};
        setMessages([...messagesData]); // Ensures re-render
        setUserInfo(userInfoData);
      } else {
        console.error("Failed to fetch messages:", response.status);
        setMessages([]);
        setUserInfo({});
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setUserInfo({});
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const updatedConversations = await fetchConversations();

      if (selectedConversation) {
        await fetchMessages(selectedConversation.id);

        const updatedSelected = updatedConversations.find(
          (c) => c.id === selectedConversation.id
        );
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }
    } catch (error) {
      console.error("❌ Refresh failed:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchConversations, fetchMessages, selectedConversation]);

  useEffect(() => {
    if (
      !hasInitialized.current &&
      targetUserId &&
      targetUserName &&
      conversations.length > 0 &&
      currentUser
    ) {
      handleDirectChat(targetUserId, targetUserName);
      hasInitialized.current = true; // ✅ Prevent future re-runs
    }
  }, [targetUserId, targetUserName, conversations, currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const handleDirectChat = async (userId, userName) => {
    const existing = conversations.find(
      (conv) => conv.otherUser?.id === userId || conv.id === userId
    );
    if (existing) {
      setSelectedConversation(existing);
    } else {
      await createNewConversation(userId, userName);
    }
  };

  const createNewConversation = async (userId, userName) => {
    if (creatingConversation) return;

    setCreatingConversation(true);
    try {
      const newConversation = {
        id: userId,
        chatId: `chat_${currentUser.id}_${userId}`,
        participants: [
          {
            id: currentUser.id,
            name: "You",
            email: currentUser.email,
            avatar: currentUser.avatar,
            isOnline: true,
          },
          {
            id: userId,
            name: userName,
            email: `${userName.toLowerCase().replace(/\s+/g, "")}@example.com`,
            avatar: null,
            isOnline: false,
          },
        ],
        otherUser: {
          id: userId,
          name: userName,
          email: `${userName.toLowerCase().replace(/\s+/g, "")}@example.com`,
          avatar: null,
          isOnline: false,
        },
        lastMessage: null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setMessages([]);
      setUserInfo({});
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
    } finally {
      setCreatingConversation(false);
    }
  };

  const sendMessage = async (content) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...(prev || []), newMessage]);

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: {
                    id: newMessage.id,
                    content: newMessage.content,
                    timestamp: newMessage.timestamp,
                    senderId: newMessage.senderId,
                  },
                  updatedAt: newMessage.timestamp,
                }
              : conv
          )
        );
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const handleNewConversation = (conversation) => {
    setConversations((prev) => [conversation, ...prev]);
    // router.replace("/chat", { scroll: false });
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  return (
    /* Fixed height calculation: 100vh minus navbar height (4rem = 64px) */
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 max-w-6xl mx-auto p-4">
      <ChatSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleConversationSelect}
        currentUser={currentUser}
        onNewConversation={handleNewConversation}
        onRefreshMessages={handleRefresh}
        onRefresh={fetchConversations} // ✅ pass correctly
      />
      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        currentUser={currentUser}
        userInfo={userInfo}
        onSendMessage={sendMessage}
        onRefreshMessages={handleRefresh}
      />
    </div>
  );
}
