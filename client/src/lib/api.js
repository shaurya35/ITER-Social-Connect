import { fetchAccessToken } from "./auth";

export const api = async (url, method = "GET", body = null, token = null) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`; // Add access token to Authorization header
  }

  try {
    let response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      credentials: "include", // Include cookies (for refresh token)
    });

    if (response.status === 401) {
      // If token is expired, try refreshing it
      const newToken = await fetchAccessToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`; // Retry with new access token
        response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : null,
          credentials: "include",
        });
      }
    }

    // Return JSON response
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};
