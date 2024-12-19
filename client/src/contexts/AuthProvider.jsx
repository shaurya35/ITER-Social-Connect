"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { fetchAccessToken } from "@/lib/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [accessToken, setAccessToken] = useState(null); 

  const getTokenExpiration = (token) => {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000; 
  };

  const refreshAccessToken = async () => {
    try {
      const newToken = await fetchAccessToken(); 
      if (newToken) {
        setAccessToken(newToken); 
        return newToken;
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
    if (accessToken) {
      scheduleTokenRefresh(accessToken);
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
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
