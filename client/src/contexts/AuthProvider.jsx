"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAccessToken } from "../lib/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // handle login
  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token); 
  };

  // handle logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    document.cookie = "refreshToken=; Max-Age=0"; 
  };

  // Automatically refresh the access token
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!accessToken) return;
      const newToken = await fetchAccessToken();
      if (newToken) setAccessToken(newToken);
    }, 14 * 60 * 1000); 
    return () => clearInterval(interval);
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access AuthContext
export const useAuth = () => useContext(AuthContext);
