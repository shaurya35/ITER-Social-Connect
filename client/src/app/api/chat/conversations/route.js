// Helper function to extract token from cookies (server-side)

import { API_CONFIG } from "@/configs/api";
const backendUrl = API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS;

function getTokenFromCookies(cookieHeader) {
  if (!cookieHeader) return null;

  try {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    return {
      refreshToken: cookies.refreshToken,
      accessToken:
        cookies.accessToken ||
        cookies.token ||
        cookies.authToken ||
        cookies.jwt,
    };
  } catch (error) {
    console.error("Error parsing cookies:", error);
    return null;
  }
}

export async function GET(request) {

  try {
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      console.error("❌ No authentication cookies found");
      return Response.json(
        { error: "No authentication cookies" },
        { status: 401 }
      );
    }

    // Extract tokens from cookies
    const tokens = getTokenFromCookies(cookieHeader);
    if (!tokens) {
      console.error("❌ Failed to parse cookies");
      return Response.json({ error: "Invalid cookies" }, { status: 401 });
    }

    const { refreshToken, accessToken } = tokens;

    // Get access token (refresh if needed)
    let authToken = accessToken;
    if (!authToken && refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL
          }/api/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookieHeader,
            },
          }
        );

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          authToken = refreshData.accessToken || refreshData.token;
        } else {
          const errorText = await refreshResponse.text();
        }
      } catch (refreshError) {
        console.error("❌ Error refreshing token:", refreshError);
      }
    }

    if (!authToken) {
      console.error("❌ No valid auth token found");
      return Response.json(
        { error: "No valid authentication token" },
        { status: 401 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // const backendUrl = `${
    //   process.env.NEXT_PUBLIC_BACKEND_URL 
    // }/api/chat/conversations`;

    // Call your actual backend conversations endpoint
    const response = await fetch(backendUrl, {
      headers,
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Backend error response:", errorText);

      // Return more specific error information
      return Response.json(
        {
          error: "Backend request failed",
          status: response.status,
          details: errorText,
          backendUrl: backendUrl,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check if backend returned expected format
    if (!data || typeof data !== "object") {
      console.error("❌ Invalid backend response format");
      return Response.json(
        { error: "Invalid backend response" },
        { status: 500 }
      );
    }

    // Transform your backend data to frontend format
    if (data.status === "ok" && Array.isArray(data.conversations)) {
      const transformedConversations = data.conversations
        .map((conv, index) => {
          // Handle missing user data
          if (!conv.user || !conv.user._id) {
            console.warn("⚠️ Conversation missing user data:", conv);
            return null;
          }

          // Handle timestamp conversion safely
          let timestampISO = new Date().toISOString();
          if (conv.timestamp && conv.timestamp.seconds) {
            timestampISO = new Date(
              conv.timestamp.seconds * 1000
            ).toISOString();
          }

          return {
            id: conv.user._id, // Use the other user's ID as conversation ID
            chatId: conv.chatId || `chat_${conv.user._id}`,
            participants: [
              {
                id: "current_user", // This will be replaced with actual current user ID
                name: "You",
                email: "you@example.com",
                avatar: null,
                isOnline: true,
              },
              {
                id: conv.user._id,
                name: conv.user.name || "Unknown User",
                email:
                  conv.user.email ||
                  `${(conv.user.name || "user")
                    .toLowerCase()
                    .replace(/\s+/g, "")}@example.com`,
                avatar: conv.user.avatar,
                isOnline: false,
              },
            ],
            otherUser: {
              id: conv.user._id,
              name: conv.user.name || "Unknown User",
              email:
                conv.user.email ||
                `${(conv.user.name || "user")
                  .toLowerCase()
                  .replace(/\s+/g, "")}@example.com`,
              avatar: conv.user.avatar,
              isOnline: false,
            },
            lastMessage: conv.lastMessage
              ? {
                  id: `msg_last_${conv.chatId}`,
                  content: conv.lastMessage,
                  timestamp: timestampISO,
                  senderId: "unknown",
                }
              : null,
            unreadCount: 0,
            createdAt: timestampISO,
            updatedAt: timestampISO,
          };
        })
        .filter(Boolean); // Remove null entries

      return Response.json(transformedConversations);
    }

    // Handle case where backend returns success but no conversations
    if (data.status === "ok") {
      return Response.json([]);
    }

    // Handle unexpected backend response format
    return Response.json([]);
  } catch (error) {
    console.error("❌ Critical error in conversations API route:", error);
    console.error("❌ Error stack:", error.stack);

    return Response.json(
      {
        error: "Internal server error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
