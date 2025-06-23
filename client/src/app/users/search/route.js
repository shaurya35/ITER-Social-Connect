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

  return (
    cookies.refreshToken ||
    cookies.accessToken ||
    cookies.token ||
    cookies.authToken ||
    cookies.jwt ||
    cookies.auth_token
  );
}

export async function GET(request) {
  try {
    console.log("��� API: /api/users called");

    // Try to get token from Authorization header first
    const authHeader = request.headers.get("Authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("🔑 Token from Authorization header");
    } else {
      // Fallback to cookies
      const cookieHeader = request.headers.get("cookie");
      console.log("🍪 Cookie header:", cookieHeader);

      if (cookieHeader) {
        token = getTokenFromCookies(cookieHeader);
        console.log("🔑 Token from cookies:", token ? "Found" : "Not found");
      }
    }

    if (!token) {
      console.log("❌ No authentication token found");
      return Response.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    console.log("✅ Token available, proceeding with mock data");

    // Mock users data - replace with your actual API call
    const mockUsers = [
      {
        id: "user_1",
        name: "Alice Johnson",
        email: "alice@example.com",
        avatar: null,
        isOnline: true,
      },
      {
        id: "user_2",
        name: "Bob Smith",
        email: "bob@example.com",
        avatar: null,
        isOnline: false,
      },
      {
        id: "user_3",
        name: "Carol Davis",
        email: "carol@example.com",
        avatar: null,
        isOnline: true,
      },
      {
        id: "user_4",
        name: "David Wilson",
        email: "david@example.com",
        avatar: null,
        isOnline: false,
      },
      {
        id: "user_5",
        name: "Emma Brown",
        email: "emma@example.com",
        avatar: null,
        isOnline: true,
      },
    ];

    console.log("👥 Returning mock users:", mockUsers.length);
    return Response.json(mockUsers);
  } catch (error) {
    console.error("❌ Error in /api/users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
