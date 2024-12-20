"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to Extract Token Expiry
  const getTokenExpiration = (token) => {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    return decoded.exp * 1000;
  };

  // Function to Reset User State
  const resetAuthState = () => {
    setUser(null);
    setAccessToken(null);
  };

  // Upon Page Reload Check for Cookies
  const initializeAuth = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleTokenRefresh(data.accessToken);
      } else if (response.status === 401) {
        resetAuthState();
      } else {
        console.error(
          `Unexpected error during auth initialization: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Failed to initialize authentication:", error);
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh tokens
  const refreshAccessToken = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to refresh access token");
      }
      const data = await response.json();
      if (data) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data.accessToken;
      }
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      logout();
    }
    return null;
  };

  // Function to schedule Refresh
  const scheduleTokenRefresh = (token) => {
    const expiration = getTokenExpiration(token);
    const now = Date.now();
    const delay = expiration - now - 5000;
    if (delay > 0) {
      setTimeout(async () => {
        const newToken = await refreshAccessToken();
        if (newToken) {
          scheduleTokenRefresh(newToken);
        }
      }, delay);
    }
  };

  // Function For Login
  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
    scheduleTokenRefresh(token);
  };

  // Function for Logout
  const logout = async () => {
    try {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Used Inside useEffect
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
