// Get token from cookies (client-side)
export function getTokenFromCookies() {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=")
    if (key && value) {
      acc[key] = decodeURIComponent(value)
    }
    return acc
  }, {})

  // Try different possible cookie names
  return (
    cookies.refreshToken ||
    cookies.accessToken ||
    cookies.token ||
    cookies.authToken ||
    cookies.jwt ||
    cookies.auth_token
  )
}

// Decode JWT to get user info
export function getCurrentUser() {
  try {
    const token = getTokenFromCookies()
    if (!token) {
      return null
    }


    // Simple JWT decode without library dependency
    const base64Url = token.split(".")[1]
    if (!base64Url) {
      return null
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    const decoded = JSON.parse(jsonPayload)

    return {
      id: decoded.id || decoded.userId || decoded.sub || decoded._id,
      name: decoded.name || decoded.username || decoded.fullName,
      email: decoded.email,
      avatar: decoded.avatar || decoded.picture,
    }
  } catch (error) {
    console.error("❌ Error decoding token:", error)
    return null
  }
}

// Create auth headers for API requests
export function getAuthHeaders() {
  const token = getTokenFromCookies()
  const headers = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  } else {
    console.log("❌ No token available for auth header")
  }

  return headers
}
