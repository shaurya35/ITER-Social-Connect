// Helper function to extract token from cookies (server-side)
function getTokenFromCookies(cookieHeader) {
  if (!cookieHeader) return null;

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
      cookies.accessToken || cookies.token || cookies.authToken || cookies.jwt,
  };
}

// Helper function to extract current user ID from JWT token
function getCurrentUserIdFromToken(token) {
  try {
    if (!token) return null;

    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const decoded = JSON.parse(jsonPayload);
    return decoded.id || decoded.userId || decoded.sub || decoded._id;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

export async function GET(request) {
  try {
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      return Response.json(
        { error: "No authentication cookies" },
        { status: 401 }
      );
    }

    // Extract tokens from cookies
    const { refreshToken, accessToken } = getTokenFromCookies(cookieHeader);

    // Get access token (refresh if needed)
    let authToken = accessToken;
    if (!authToken && refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${process.env.BACKEND_URL}/api/auth/refresh`,
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
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
      }
    }

    // Get current user ID from token
    const currentUserId = getCurrentUserIdFromToken(authToken);

    const headers = {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Call your actual backend conversations endpoint
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/chat/conversations`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return Response.json(
        { error: "Failed to fetch conversations" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform your backend data to frontend format
    if (data.status === "ok" && data.conversations) {
      const transformedConversations = data.conversations.map((conv) => {
        return {
          id: conv.user._id, // Use the other user's ID as conversation ID
          chatId: conv.chatId,
          participants: [
            {
              id: currentUserId, // Use the actual current user ID from JWT
              name: "You", // Keep "You" for current user in participants
              email: "you@example.com",
              avatar: null,
              isOnline: true,
            },
            {
              id: conv.user._id, // Other user
              name: conv.user.name, // 👤 Use actual user name from backend
              email:
                conv.user.email ||
                `${conv.user.name.toLowerCase().replace(" ", "")}@example.com`,
              avatar: conv.user.avatar, // 🖼️ Supabase URL from backend
              isOnline: false,
            },
          ],
          // 👤 Store the other user info directly for easy access in UI
          otherUser: {
            id: conv.user._id,
            name: conv.user.name, // 👤 Real user name for display (e.g., "Shaurya Jha", "Don Sharma")
            email:
              conv.user.email ||
              `${conv.user.name.toLowerCase().replace(" ", "")}@example.com`,
            avatar: conv.user.avatar, // 🖼️ Supabase URL for profile picture
            isOnline: false,
          },
          lastMessage: {
            id: `msg_last_${conv.chatId}`,
            content: conv.lastMessage,
            timestamp: new Date(conv.timestamp.seconds * 1000).toISOString(),
            senderId: "unknown", // We don't know who sent the last message from this endpoint
          },
          unreadCount: 0,
          createdAt: new Date(conv.timestamp.seconds * 1000).toISOString(),
          updatedAt: new Date(conv.timestamp.seconds * 1000).toISOString(),
        };
      });

      return Response.json(transformedConversations);
    }

    return Response.json([]);
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    return Response.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
