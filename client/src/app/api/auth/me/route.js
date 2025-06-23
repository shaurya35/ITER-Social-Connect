// Helper function to extract token from cookies
function getTokenFromCookies(cookieHeader) {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=")
    if (key && value) {
      acc[key] = decodeURIComponent(value)
    }
    return acc
  }, {})

  return {
    refreshToken: cookies.refreshToken,
    accessToken: cookies.accessToken || cookies.token || cookies.authToken || cookies.jwt,
  }
}

export async function GET(request) {
  try {

    const cookieHeader = request.headers.get("cookie")

    if (!cookieHeader) {
      return Response.json({ error: "No authentication cookies found" }, { status: 401 })
    }

    // Extract tokens from cookies
    const { refreshToken, accessToken } = getTokenFromCookies(cookieHeader)

    // If we only have refresh token, we need to get an access token first
    let authToken = accessToken
    if (!authToken && refreshToken) {

      try {
        const refreshResponse = await fetch(`${process.env.BACKEND_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          authToken = refreshData.accessToken || refreshData.token
        } else {
          console.log("❌ Failed to refresh token:", refreshResponse.status)
        }
      } catch (refreshError) {
        console.error("❌ Error refreshing token:", refreshError)
      }
    }

    if (!authToken) {
      return Response.json({ error: "No authentication token found" }, { status: 401 })
    }

    // Make request to your backend with the token
    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        Cookie: cookieHeader,
      },
    })


    if (!response.ok) {
      const errorText = await response.text()
      return Response.json({ error: "Authentication failed" }, { status: response.status })
    }

    const userData = await response.json()

    // Transform the user data to match your frontend expectations
    const transformedUser = {
      id: userData.id || userData._id,
      name: userData.name || userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
      email: userData.email,
      avatar: userData.avatar || userData.profilePicture, // 🖼️ Include avatar/profile picture
      isOnline: true,
      userType: userData.userType || userData.role || "student",
    }



    return Response.json(transformedUser)
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
