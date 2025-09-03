// ✅ FIXED: Correct API route to match backend structure
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

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    console.log("🔍 Frontend API: Fetching user info for:", userId);

    // ✅ IMPORTANT: Don't require authentication for user info lookup
    // This allows the chat system to fetch user info for display purposes
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/${userId}`;
    console.log("📡 Calling backend at:", backendUrl);

    // Try with authentication first
    const cookieHeader = request.headers.get("cookie");
    const headers = {
      "Content-Type": "application/json",
    };

    if (cookieHeader) {
      const { refreshToken, accessToken } = getTokenFromCookies(cookieHeader);

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

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      if (cookieHeader) {
        headers["Cookie"] = cookieHeader;
      }
    }

    const response = await fetch(backendUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Backend error:", errorText);

      // ✅ Return a fallback user object instead of failing completely
      return Response.json({
        id: userId,
        name: `User ${userId.substring(0, 8)}`, // Show first 8 chars of ID
        email: `user${userId.substring(0, 8)}@example.com`,
        avatar: null,
        about: "",
      });
    }

    const userData = await response.json();
    console.log("✅ User data received from backend:", userData);

    // ✅ FIXED: Use the exact structure your backend returns
    const transformedUser = {
      id: userData.id || userId,
      name: userData.name || "Unknown User", // This should now work correctly
      email: userData.email || `user${userId}@example.com`,
      avatar: userData.avatar || userData.profilePicture, // Handle both fields
      profilePicture: userData.profilePicture || userData.avatar, // Include both for compatibility
      about: userData.about || "",
    };

    console.log("✅ Transformed user data:", transformedUser);
    return Response.json(transformedUser);
  } catch (error) {
    console.error("❌ Error fetching user:", error);

    // ✅ Return fallback instead of error to prevent UI breaking
    return Response.json({
      id: params.userId,
      name: `User ${params.userId.substring(0, 8)}`,
      email: `user${params.userId.substring(0, 8)}@example.com`,
      avatar: null,
      about: "",
    });
  }
}
