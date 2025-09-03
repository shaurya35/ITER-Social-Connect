"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthProvider";
import { API_CONFIG } from "@/configs/api";
import { useAuth } from "@/contexts/AuthProvider";
import axios from "axios";

export function MessageButton({ targetUser, className = "" }) {
  // const { accessToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const handleMessageClick = async () => {
    if (!currentUser || !targetUser) {
      console.error("Missing user data:", { currentUser, targetUser });
      return;
    }

    if (currentUser.id === targetUser.id) {
      return;
    }

    setLoading(true);

    try {
      // Create or get conversation with the target user
      // const response = await fetch("/api/chat/conversations/create", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   credentials: "include",
      //   body: JSON.stringify({
      //     targetUserId: targetUser.id,
      //     targetUserName: targetUser.name,
      //     targetUserEmail: targetUser.email,
      //     targetUserAvatar: targetUser.avatar,
      //   }),
      // });

      // const response = await fetch(`${BACKEND_URL}/api/chat/conversations/create`,
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     credentials: "include",
      //     body: JSON.stringify({
      //       targetUserId: targetUser.id,
      //       targetUserName: targetUser.name,
      //       targetUserEmail: targetUser.email,
      //       targetUserAvatar: targetUser.avatar,
      //     }),
      //   }
      // );

      const response = await axios.get(
        `${BACKEND_URL}/api/chat/conversations/create`,
        {
          withCredentials: true,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );

      if (response.ok) {
        const conversation = response.data.conversations;
        console.log(conversation);
        console.log(conversation.id);

        // Navigate to chat page with the conversation
        router.push(`/chat?conversation=${conversation.id}`);
      } else {
        console.error("Failed to create conversation:", response.status);
        // Fallback: just navigate to chat page
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      // Fallback: just navigate to chat page
      router.push("/chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMessageClick}
      disabled={loading || !targetUser || currentUser?.id === targetUser?.id}
      className={`${className}`}
      variant="outline"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      ) : (
        <MessageCircle className="h-4 w-4 mr-2" />
      )}
      {loading ? "Starting..." : "Message"}
    </Button>
  );
}
