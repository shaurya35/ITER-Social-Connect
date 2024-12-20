"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { fetchAccessToken } from "@/lib/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [accessToken, setAccessToken] = useState(null); 
  const [loading, setLoading] = useState(true); 

  const getTokenExpiration = (token) => {
    const decoded = JSON.parse(atob(token.split(".")[1])); 
    return decoded.exp * 1000;
  };

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
      } else {
        throw new Error("Failed to refresh access token");
      }
    } catch (error) {
      console.error("Failed to initialize authentication:", error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false); 
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetchAccessToken(); 
      if (response) {
        setAccessToken(response.accessToken); 
        setUser(response.user); 
        return response.accessToken;
      }
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      logout();
    }
    return null;
  };

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

  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
    scheduleTokenRefresh(token);
  };

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
