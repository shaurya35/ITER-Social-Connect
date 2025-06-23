import { jwtDecode } from "jwt-decode";
import { BACKEND_URL } from "@/configs";

/**
 * Extracts the token expiration timestamp from a JWT.
 * @param {string} token - The JWT token.
 * @returns {number} - The expiration timestamp in milliseconds.
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

/**
 * Fetches the authentication state (accessToken and user) via SSR.
 * @returns {Promise<{accessToken: string, user: object}|null>} - Auth state or null if not authenticated.
 */

export const fetchAuthStateSSR = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return { accessToken: data.accessToken, user: data.user };
    } else if (response.status === 401) {
      console.warn("Unauthorized during SSR auth fetch");
      return null;
    }

    throw new Error(`Unexpected error during SSR auth fetch: ${response.statusText}`);
  } catch (error) {
    console.error("Error during SSR auth fetch:", error);
    return null;
  }
};

/**
 * Resets the authentication state (used for SSR fallback).
 * @returns {{user: null, accessToken: null}}
 */
export const resetAuthState = () => ({
  user: null,
  accessToken: null,
});
