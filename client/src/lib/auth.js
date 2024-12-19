export const fetchAccessToken = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/auth/refresh", {
      method: "POST",
      credentials: "include", 
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    const data = await response.json();
    return data.accessToken; 
  } catch (error) {
    console.error("Error fetching new access token:", error);
    return null;
  }
};
