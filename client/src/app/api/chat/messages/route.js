// Helper function to extract token from cookies
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

// Helper function to convert Firebase timestamp to ISO string
function convertFirebaseTimestamp(timestamp) {
  if (timestamp && timestamp.seconds) {
    return new Date(
      timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
    ).toISOString();
  }
  return new Date().toISOString();
}

export async function POST(request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const body = await request.json();

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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh`,
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

    // Prepare payload exactly as your backend expects
    const backendPayload = {
      receiverId: body.conversationId, // The person we're sending to
      text: body.content, // The message content
    };

    const headers = {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Call your actual backend message endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/message`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(backendPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return Response.json(
        { error: "Failed to send message" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform backend response to frontend format
    if (data.status === "sent" && data.result) {
      const transformedMessage = {
        id: `msg_${data.result.senderId}_${
          data.result.timestamp.seconds
        }_${Date.now()}`,
        conversationId: body.conversationId,
        senderId: data.result.senderId,
        content: data.result.text,
        timestamp: convertFirebaseTimestamp(data.result.timestamp),
        type: "text",
        receiverId: data.result.receiverId,
      };

      // 🚀 Broadcast message via WebSocket to all connected clients
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/websocket/broadcast`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "new_message",
              conversationId: body.conversationId,
              senderId: data.result.senderId,
              receiverId: data.result.receiverId,
              content: data.result.text,
              messageId: transformedMessage.id,
              timestamp: transformedMessage.timestamp,
            }),
          }
        );
      } catch (broadcastError) {
        console.warn("⚠️ Failed to broadcast via WebSocket:", broadcastError);
      }

      return Response.json(transformedMessage);
    }

    return Response.json(
      { error: "Invalid response from backend" },
      { status: 500 }
    );
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
