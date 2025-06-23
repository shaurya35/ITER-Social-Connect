// "use client";

// import { useState, useRef, useEffect } from "react";
// import {
//   Send,
//   MoreVertical,
//   Phone,
//   Video,
//   Info,
//   RefreshCw,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import avatarCache from "@/utils/avatarCache";
// import { useTheme } from "@/contexts/ThemeContext";
// import { ChatInfoModal } from "./ChatInfoModal";

// export function ChatWindow({
//   conversation,
//   messages,
//   currentUser,
//   onSendMessage,
//   onRefreshMessages,
//   isFirebase,
//   userInfo, // Added userInfo prop
// }) {
//   const [newMessage, setNewMessage] = useState("");
//   const [sending, setSending] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [avatarLoadStates, setAvatarLoadStates] = useState({}); // Track avatar loading
//   const [showChatInfo, setShowChatInfo] = useState(false);
//   const messagesEndRef = useRef(null);
//   const { isDarkMode } = useTheme();

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({
//       behavior: "smooth",
//       block: "end", // 👈 only scrolls just enough to reveal the bottom
//       inline: "nearest",
//     });
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (newMessage.trim() && !sending) {
//       setSending(true);
//       try {
//         console.log("📤 ChatWindow: Sending message:", {
//           message: newMessage.trim(),
//           conversationId: conversation?.id,
//           otherUserId: conversation?.otherUser?.id,
//         });

//         await onSendMessage(newMessage.trim());
//         setNewMessage("");
//         console.log("✅ ChatWindow: Message sent successfully");
//       } catch (error) {
//         console.error("❌ ChatWindow: Failed to send message:", error);
//         // Show user-friendly error message
//         alert(`Failed to send message: ${error.message || "Unknown error"}`);
//       } finally {
//         setSending(false);
//       }
//     }
//   };

//   const handleRefresh = async () => {
//     if (refreshing || !onRefreshMessages) return;

//     setRefreshing(true);
//     try {
//       await onRefreshMessages();
//     } catch (error) {
//       console.error("Failed to refresh messages:", error);
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const formatMessageTime = (timestamp) => {
//     return new Date(timestamp).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // 🖼️ Enhanced avatar handling with loading states
//   const handleAvatarLoad = (userId, context = "") => {
//     console.log(`✅ ${context} avatar loaded for user ${userId}`);
//     setAvatarLoadStates((prev) => ({
//       ...prev,
//       [userId]: { loaded: true, error: false },
//     }));
//   };

//   const handleAvatarError = (userId, context = "") => {
//     console.log(`❌ ${context} avatar failed for user ${userId}`);
//     setAvatarLoadStates((prev) => ({
//       ...prev,
//       [userId]: { loaded: false, error: true },
//     }));
//   };

//   // 🖼️ Smart avatar resolver - uses cache first, then fallback
//   const getAvatarForUser = (userId, fallbackAvatar = null) => {
//     // Try cache first
//     const cachedAvatar = avatarCache.getAvatar(userId);
//     if (cachedAvatar) {
//       return cachedAvatar;
//     }

//     // Fallback to provided avatar
//     if (fallbackAvatar) {
//       // Cache it for future use
//       avatarCache.setAvatar(userId, fallbackAvatar);
//       return fallbackAvatar;
//     }

//     // Final fallback
//     return "/placeholder.svg";
//   };

//   if (!conversation) {
//     return (
//       <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
//         <div className="text-center">
//           <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Send className="h-12 w-12 text-gray-400 dark:text-gray-500" />
//           </div>
//           <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
//             Welcome to ITER Social Connect Chat
//           </h3>
//           <p className="text-gray-600 dark:text-gray-400">
//             Select a conversation to start messaging
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const otherUser = conversation.otherUser || {
//     id: "unknown",
//     name: "Unknown User",
//     avatar: null,
//     isOnline: false,
//   };

//   const headerLoadState = avatarLoadStates[otherUser.id] || {
//     loaded: false,
//     error: false,
//   };

//   return (
//     <>
//       {/* Fixed height: Take remaining space after navbar */}
//       <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)]">
//         {/* Chat Header - Fixed height */}
//         <div className="flex-shrink-0 p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
//               <Avatar className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0">
//                 {/* 🖼️ ENHANCED: Better avatar handling with CORS */}
//                 {otherUser.avatar ? (
//                   <AvatarImage
//                     src={
//                       getAvatarForUser(otherUser.id, otherUser.avatar) ||
//                       "/placeholder.svg" ||
//                       "/placeholder.svg"
//                     }
//                     alt={otherUser.name}
//                     className="object-cover"
//                     crossOrigin="anonymous"
//                     onLoad={() => handleAvatarLoad(otherUser.id, "Chat header")}
//                     onError={() =>
//                       handleAvatarError(otherUser.id, "Chat header")
//                     }
//                     style={{
//                       display: headerLoadState.error ? "none" : "block",
//                     }}
//                   />
//                 ) : null}
//                 <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white text-xs lg:text-sm">
//                   {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
//                 </AvatarFallback>
//               </Avatar>
//               <div className="min-w-0 flex-1">
//                 <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
//                   {otherUser.name || "Unknown User"}
//                 </h2>
//                 <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
//                   {otherUser.isOnline ? "Online" : "Offline"}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
//               {/* 🎯 Manual Refresh Button (only for backend mode) */}
//               {!isFirebase && (
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   title="Refresh Messages"
//                   onClick={handleRefresh}
//                   disabled={refreshing}
//                   className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
//                 >
//                   <RefreshCw
//                     className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${
//                       refreshing ? "animate-spin" : ""
//                     }`}
//                   />
//                 </Button>
//               )}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 title="Voice Call"
//                 className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
//                 disabled
//               >
//                 <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 title="Video Call"
//                 className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
//                 disabled
//               >
//                 <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 title="Chat Info"
//                 className="hover:bg-gray-100 dark:hover:bg-gray-700"
//                 onClick={() => setShowChatInfo(true)}
//               >
//                 <Info className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 title="More Options"
//                 className="hover:bg-gray-100 dark:hover:bg-gray-700"
//                 disabled
//               >
//                 <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//               </Button>
//             </div>
//           </div>

//           {/* Status indicator */}
//           {!isFirebase && (
//             <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
//               <span>💡 Refresh for new messages</span>
//             </div>
//           )}
//         </div>

//         {/* Messages - Scrollable area with calculated height */}
//         <div className="flex-1 overflow-y-auto p-2 lg:p-3 bg-gray-50 dark:bg-gray-900 min-h-0">
//           {!messages || messages.length === 0 ? (
//             <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
//               <p className="text-sm lg:text-base">No messages yet</p>
//               <p className="text-xs lg:text-sm mt-1">Start the conversation!</p>
//             </div>
//           ) : (
//             <div className="space-y-2 lg:space-y-3">
//               {messages.map((message, index) => {
//                 if (!message || !message.id) {
//                   return null;
//                 }

//                 const isMyMessage =
//                   String(message.senderId) === String(currentUser?.id);

//                 const senderAvatar =
//                   message.senderAvatar ||
//                   userInfo?.[`${message.senderId}Avatar`] ||
//                   null;

//                 return (
//                   <div
//                     key={message.id}
//                     className={`flex w-full ${
//                       isMyMessage ? "justify-end" : "justify-start"
//                     }`}
//                   >
//                     <div
//                       className={`flex items-start max-w-[85%] lg:max-w-[70%] ${
//                         isMyMessage ? "flex-row-reverse" : ""
//                       }`}
//                     >
//                       {/* Avatar aligned to start of the message */}
//                       <Avatar
//                         className={`h-6 w-6 lg:h-8 lg:w-8 mt-1 flex-shrink-0 ${
//                           isMyMessage ? "ml-2 lg:ml-3" : "mr-2 lg:mr-3"
//                         }`}
//                       >
//                         <AvatarImage
//                           src={senderAvatar || "/placeholder.svg"}
//                           alt={isMyMessage ? "You" : otherUser.name}
//                           className="object-cover"
//                           onError={(e) => (e.target.style.display = "none")}
//                         />
//                         <AvatarFallback
//                           className={`text-white text-xs ${
//                             isMyMessage
//                               ? "bg-blue-600 dark:bg-blue-500"
//                               : "bg-gray-400 dark:bg-gray-600"
//                           }`}
//                         >
//                           {isMyMessage
//                             ? "Y"
//                             : otherUser.name?.charAt(0)?.toUpperCase() || "U"}
//                         </AvatarFallback>
//                       </Avatar>

//                       {/* Message Bubble and Timestamp */}
//                       <div className="flex flex-col min-w-0">
//                         <div
//                           className={`px-3 lg:px-4 py-2 rounded-2xl max-w-full break-words ${
//                             isMyMessage
//                               ? "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-md"
//                               : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-300 dark:border-gray-600"
//                           }`}
//                         >
//                           <p className="text-sm leading-relaxed whitespace-pre-wrap">
//                             {message.content || message.text || "No content"}
//                           </p>
//                         </div>

//                         <p
//                           className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
//                             isMyMessage ? "text-right mr-2" : "text-left ml-2"
//                           }`}
//                         >
//                           {message.timestamp
//                             ? formatMessageTime(message.timestamp)
//                             : ""}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Message Input - Fixed at bottom */}
//         <div className="flex-shrink-0 p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
//           <form
//             onSubmit={handleSendMessage}
//             className="flex items-center space-x-2 lg:space-x-3"
//           >
//             <div className="flex-1 relative">
//               <Input
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 placeholder="Type a message..."
//                 className="pr-12 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
//                 disabled={sending}
//               />
//             </div>
//             <Button
//               type="submit"
//               disabled={!newMessage.trim() || sending}
//               className="rounded-full w-9 h-9 lg:w-10 lg:h-10 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
//             >
//               {sending ? (
//                 <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-b-2 border-white"></div>
//               ) : (
//                 <Send className="h-3 w-3 lg:h-4 lg:w-4" />
//               )}
//             </Button>
//           </form>
//         </div>
//       </div>

//       {/* Chat Info Modal */}
//       <ChatInfoModal
//         isOpen={showChatInfo}
//         onClose={() => setShowChatInfo(false)}
//         otherUser={otherUser}
//       />
//     </>
//   );
// }


"use client"

import { useState, useRef, useEffect } from "react"
import { Send, MoreVertical, Phone, Video, Info, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import avatarCache from "@/utils/avatarCache"
import { useTheme } from "@/contexts/ThemeContext"
import { ChatInfoModal } from "./ChatInfoModal"

export function ChatWindow({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onRefreshMessages,
  isFirebase,
  userInfo, // Added userInfo prop
}) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [avatarLoadStates, setAvatarLoadStates] = useState({}) // Track avatar loading
  const [showChatInfo, setShowChatInfo] = useState(false)
  const messagesEndRef = useRef(null)
  const { isDarkMode } = useTheme()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end", // 👈 only scrolls just enough to reveal the bottom
      inline: "nearest",
    })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (newMessage.trim() && !sending) {
      setSending(true)
      try {
        

        await onSendMessage(newMessage.trim())
        setNewMessage("")
      } catch (error) {
        // Show user-friendly error message
        alert(`Failed to send message: ${error.message || "Unknown error"}`)
      } finally {
        setSending(false)
      }
    }
  }

  const handleRefresh = async () => {
    if (refreshing || !onRefreshMessages) return

    setRefreshing(true)
    try {
      await onRefreshMessages()
    } catch (error) {
      console.error("Failed to refresh messages:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 🖼️ Enhanced avatar handling with loading states
  const handleAvatarLoad = (userId, context = "") => {
    setAvatarLoadStates((prev) => ({
      ...prev,
      [userId]: { loaded: true, error: false },
    }))
  }

  const handleAvatarError = (userId, context = "") => {
    setAvatarLoadStates((prev) => ({
      ...prev,
      [userId]: { loaded: false, error: true },
    }))
  }

  // 🖼️ Smart avatar resolver - uses cache first, then fallback
  const getAvatarForUser = (userId, fallbackAvatar = null) => {
    // Try cache first
    const cachedAvatar = avatarCache.getAvatar(userId)
    if (cachedAvatar) {
      return cachedAvatar
    }

    // Fallback to provided avatar
    if (fallbackAvatar) {
      // Cache it for future use
      avatarCache.setAvatar(userId, fallbackAvatar)
      return fallbackAvatar
    }

    // Final fallback
    return "/placeholder.svg"
  }

  // 🎯 Helper function to determine if messages should be grouped
  const shouldGroupWithPrevious = (currentMessage, previousMessage) => {
    if (!previousMessage) return false

    // Group if same sender and within 2 minutes
    const timeDiff = new Date(currentMessage.timestamp) - new Date(previousMessage.timestamp)
    const sameUser = String(currentMessage.senderId) === String(previousMessage.senderId)
    const withinTimeLimit = timeDiff < 2 * 60 * 1000 // 2 minutes

    return sameUser && withinTimeLimit
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Welcome to ITER Social Connect Chat
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Select a conversation to start messaging</p>
        </div>
      </div>
    )
  }

  const otherUser = conversation.otherUser || {
    id: "unknown",
    name: "Unknown User",
    avatar: null,
    isOnline: false,
  }

  const headerLoadState = avatarLoadStates[otherUser.id] || {
    loaded: false,
    error: false,
  }

  return (
    <>
      {/* Fixed height: Take remaining space after navbar */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)]">
        {/* Chat Header - Fixed height */}
        <div className="flex-shrink-0 p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
              <Avatar className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0">
                {/* 🖼️ ENHANCED: Better avatar handling with CORS */}
                {otherUser.avatar ? (
                  <AvatarImage
                    src={getAvatarForUser(otherUser.id, otherUser.avatar) || "/placeholder.svg" || "/placeholder.svg"}
                    alt={otherUser.name}
                    className="object-cover"
                    crossOrigin="anonymous"
                    onLoad={() => handleAvatarLoad(otherUser.id, "Chat header")}
                    onError={() => handleAvatarError(otherUser.id, "Chat header")}
                    style={{
                      display: headerLoadState.error ? "none" : "block",
                    }}
                  />
                ) : null}
                <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white text-xs lg:text-sm">
                  {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {otherUser.name || "Unknown User"}
                </h2>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                  {otherUser.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
              {/* 🎯 Manual Refresh Button (only for backend mode) */}
              {!isFirebase && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Refresh Messages"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                title="Voice Call"
                className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
                disabled
              >
                <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Video Call"
                className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
                disabled
              >
                <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Chat Info"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowChatInfo(true)}
              >
                <Info className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="More Options"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled
              >
                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          {!isFirebase && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
              <span>💡 Refresh for new messages</span>
            </div>
          )}
        </div>

        {/* Messages - Scrollable area with calculated height */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 bg-gray-50 dark:bg-gray-900 min-h-0">
          {!messages || messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <p className="text-sm lg:text-base">No messages yet</p>
              <p className="text-xs lg:text-sm mt-1">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => {
                if (!message || !message.id) {
                  return null
                }

                const isMyMessage = String(message.senderId) === String(currentUser?.id)
                const previousMessage = index > 0 ? messages[index - 1] : null
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

                // 🎯 Smart grouping logic
                const isGroupedWithPrevious = shouldGroupWithPrevious(message, previousMessage)
                const isGroupedWithNext = nextMessage ? shouldGroupWithPrevious(nextMessage, message) : false

                // 🎯 Dynamic spacing based on grouping
                const marginTop = isGroupedWithPrevious ? "mt-0.5" : "mt-3"
                const marginBottom = isGroupedWithNext ? "mb-0.5" : "mb-2"

                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"} ${marginTop} ${marginBottom}`}
                  >
                    <div
                      className={`flex flex-col max-w-[85%] lg:max-w-[70%] ${isMyMessage ? "items-end" : "items-start"}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`px-3 lg:px-4 py-2 max-w-full break-words transition-all duration-200 hover:shadow-md ${
                          isMyMessage
                            ? `bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-sm ${
                                isGroupedWithPrevious && isGroupedWithNext
                                  ? "rounded-lg" // Middle message in group
                                  : isGroupedWithPrevious
                                    ? "rounded-t-lg rounded-bl-2xl rounded-br-lg" // Last message in group
                                    : isGroupedWithNext
                                      ? "rounded-b-lg rounded-tl-2xl rounded-tr-lg" // First message in group
                                      : "rounded-2xl" // Single message
                              }`
                            : `bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-600 ${
                                isGroupedWithPrevious && isGroupedWithNext
                                  ? "rounded-lg" // Middle message in group
                                  : isGroupedWithPrevious
                                    ? "rounded-t-lg rounded-br-2xl rounded-bl-lg" // Last message in group
                                    : isGroupedWithNext
                                      ? "rounded-b-lg rounded-tr-2xl rounded-tl-lg" // First message in group
                                      : "rounded-2xl" // Single message
                              }`
                        }`}
                      >
                        <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap">
                          {message.content || message.text || "No content"}
                        </p>
                      </div>

                      {/* Timestamp - Only show for last message in group or single messages */}
                      {!isGroupedWithNext && (
                        <p
                          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-1 ${
                            isMyMessage ? "text-right" : "text-left"
                          }`}
                        >
                          {message.timestamp ? formatMessageTime(message.timestamp) : ""}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="flex-shrink-0 p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2 lg:space-x-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="pr-12 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
                disabled={sending}
              />
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="rounded-full w-9 h-9 lg:w-10 lg:h-10 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-3 w-3 lg:h-4 lg:w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Chat Info Modal */}
      <ChatInfoModal isOpen={showChatInfo} onClose={() => setShowChatInfo(false)} otherUser={otherUser} />
    </>
  )
}
