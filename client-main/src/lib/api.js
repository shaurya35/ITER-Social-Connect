import { fetchAccessToken } from "./auth";

export const api = async (url, method = "GET", body = null, token = null) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`; 
  }
  try {
    let response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      credentials: "include", 
    });
    if (response.status === 401) {
      const newToken = await fetchAccessToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : null,
          credentials: "include",
        });
      }
    }
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error; 
  }
};
