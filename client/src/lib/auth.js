export const fetchAccessToken = async () => {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();
  if (data.accessToken) return data.accessToken;
  return null;
};
