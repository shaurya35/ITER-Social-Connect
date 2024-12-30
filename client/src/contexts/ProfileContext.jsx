// contexts/ProfileContext.jsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthProvider";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, accessToken } = useAuth();

  useEffect(() => {
    if (user && accessToken) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const response = await axios.get("http://localhost:8080/api/profile", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setProfile(response.data);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, accessToken]);

  return (
    <ProfileContext.Provider value={{ profile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);