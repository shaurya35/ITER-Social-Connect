"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { fetchAuthStateSSR, getTokenExpiration, resetAuthState } from "../lib/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Schedules token refresh
  const scheduleTokenRefresh = (token) => {
    const expiration = getTokenExpiration(token);
    const now = Date.now();
    const delay = expiration - now - 5000; // Refresh 5 seconds before expiration

    if (delay > 0) {
      setTimeout(async () => {
        try {
          const data = await fetchAuthStateSSR();
          if (data) {
            setAccessToken(data.accessToken);
            setUser(data.user);
            scheduleTokenRefresh(data.accessToken);
          } else {
            const { user, accessToken } = resetAuthState();
            setUser(user);
            setAccessToken(accessToken);
          }
        } catch {
          const { user, accessToken } = resetAuthState();
          setUser(user);
          setAccessToken(accessToken);
        }
      }, delay);
    }
  };

  // Initializes authentication state
  const initializeAuth = async () => {
    try {
      const data = await fetchAuthStateSSR();
      if (data) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleTokenRefresh(data.accessToken);
      } else {
        const { user, accessToken } = resetAuthState();
        setUser(user);
        setAccessToken(accessToken);
      }
    } catch {
      const { user, accessToken } = resetAuthState();
      setUser(user);
      setAccessToken(accessToken);
    } finally {
      setLoading(false);
    }
  };

  // Handles login
  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
    scheduleTokenRefresh(token);
  };

  // Handles logout
  const logout = async () => {
    try {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      const { user, accessToken } = resetAuthState();
      setUser(user);
      setAccessToken(accessToken);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Fetches authentication state on initial render
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
