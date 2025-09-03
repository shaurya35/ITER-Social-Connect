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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      return Response.json(
        { error: "No authentication cookies" },
        { status: 401 }
      );
    }

    if (!query || query.trim() === "") {
      return Response.json(
        { error: "Search query cannot be empty" },
        { status: 400 }
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

    const headers = {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Call your backend user search endpoint
    // const response = await fetch(`http://localhost:8080/api/chat/search?query=${encodeURIComponent(query)}`, {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL
      }/api/chat/search?query=${encodeURIComponent(query)}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return Response.json(
        { error: "Failed to search users" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform backend response to frontend format
    if (data.status === "ok" && data.users) {
      const transformedUsers = data.users.map((user) => ({
        id: user._id,
        name: user.name,
        email:
          user.email ||
          `${user.name.toLowerCase().replace(/\s+/g, "")}@example.com`,
        avatar: user.avatar,
        about: user.about || "",
      }));

      return Response.json(transformedUsers);
    }

    return Response.json([]);
  } catch (error) {
    console.error("❌ Error searching users:", error);
    return Response.json({ error: "Failed to search users" }, { status: 500 });
  }
}
