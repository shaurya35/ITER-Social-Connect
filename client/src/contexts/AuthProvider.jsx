// "use client";

// import { createContext, useContext, useState, useEffect } from "react";
// import {
//   fetchAuthStateSSR,
//   getTokenExpiration,
//   resetAuthState,
// } from "@/lib/auth";
// import { BACKEND_URL } from "@/configs";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // ⏳ Schedule token refresh just before expiration
//   const scheduleTokenRefresh = (token) => {
//     const expiration = getTokenExpiration(token);
//     const now = Date.now();
//     const delay = expiration - now - 5000; // Refresh 5 seconds before expiry

//     if (delay > 0) {
//       setTimeout(async () => {
//         try {
//           const data = await fetchAuthStateSSR();
//           if (data) {
//             setAccessToken(data.accessToken);
//             setUser(data.user);
//             storeUserLocally(data.user);
//             scheduleTokenRefresh(data.accessToken);
//           } else {
//             console.warn("⚠️ Token refresh failed, resetting auth");
//             clearAuth();
//           }
//         } catch (err) {
//           console.error("❌ Token refresh error:", err);
//           clearAuth();
//         }
//       }, delay);
//     }
//   };

//   const storeUserLocally = (userData) => {
//     const normalizedUser = {
//       id: userData.id || userData.userId,
//       name: userData.name || userData.fullName || "Unknown User",
//       email: userData.email || "",
//       avatar: userData.avatar || userData.profilePicture || null,
//       isOnline: userData.isOnline !== undefined ? userData.isOnline : true,
//       userType: userData.userType || userData.role || "student",
//     };
//     localStorage.setItem("user", JSON.stringify(normalizedUser));
//     setUser(normalizedUser);
//   };

//   const clearAuth = () => {
//     localStorage.removeItem("user");
//     const { user, accessToken } = resetAuthState();
//     setUser(user);
//     setAccessToken(accessToken);
//   };

//   // 🧪 Initialize on first render
//   const initializeAuth = async () => {
//     try {
//       const data = await fetchAuthStateSSR();
//       if (data) {
//         setAccessToken(data.accessToken);
//         storeUserLocally(data.user);
//         scheduleTokenRefresh(data.accessToken);
//       } else {
//         const storedUser = localStorage.getItem("user");
//         if (storedUser) {
//           const parsedUser = JSON.parse(storedUser);
//           setUser(parsedUser);
//         }
//       }
//     } catch (err) {
//       console.error("❌ Error during auth init:", err);
//       clearAuth();
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     initializeAuth();
//   }, []);

//   const login = (userData, token) => {
//     setAccessToken(token);
//     storeUserLocally(userData);
//     scheduleTokenRefresh(token);
//   };

//   const logout = async () => {
//     try {
//       await fetch(`${BACKEND_URL}/api/auth/logout`, {
//         method: "POST",
//         credentials: "include",
//       });
//     } catch (err) {
//       console.error("❌ Failed to logout from backend:", err);
//     }
//     clearAuth();
//   };

//   const value = {
//     user,
//     accessToken,
//     login,
//     logout,
//     loading,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };


"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  fetchAuthStateSSR,
  getTokenExpiration,
  resetAuthState,
} from "@/lib/auth";
import { BACKEND_URL } from "@/configs";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⏳ Schedule token refresh just before expiration
  const scheduleTokenRefresh = (token) => {
    const expiration = getTokenExpiration(token);
    const now = Date.now();
    const delay = expiration - now - 5000; // Refresh 5 seconds before expiry

    if (delay > 0) {
      setTimeout(async () => {
        try {
          const data = await fetchAuthStateSSR();
          if (data) {
            storeUserLocally(data.user, data.accessToken);
            scheduleTokenRefresh(data.accessToken);
          } else {
            console.warn("⚠️ Token refresh failed, resetting auth");
            clearAuth();
          }
        } catch (err) {
          console.error("❌ Token refresh error:", err);
          clearAuth();
        }
      }, delay);
    }
  };

  // ✅ Save user + token to localStorage
  const storeUserLocally = (userData, token = null) => {
    const normalizedUser = {
      id: userData.id || userData.userId,
      name: userData.name || userData.fullName || "Unknown User",
      email: userData.email || "",
      avatar: userData.avatar || userData.profilePicture || null,
      isOnline: userData.isOnline !== undefined ? userData.isOnline : true,
      userType: userData.userType || userData.role || "student",
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);

    if (token) {
      localStorage.setItem("accessToken", token);
      setAccessToken(token);
    }
  };

  // ✅ Clear user + token
  const clearAuth = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    const { user, accessToken } = resetAuthState();
    setUser(user);
    setAccessToken(accessToken);
  };

  // 🧪 Initialize on first render
  const initializeAuth = async () => {
    try {
      const data = await fetchAuthStateSSR();
      if (data) {
        storeUserLocally(data.user, data.accessToken); // ✅ save both
        scheduleTokenRefresh(data.accessToken);
      } else {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setAccessToken(storedToken);
        }
      }
    } catch (err) {
      console.error("❌ Error during auth init:", err);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  // ✅ Login = save user + token
  const login = (userData, token) => {
    storeUserLocally(userData, token);
    scheduleTokenRefresh(token);
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("❌ Failed to logout from backend:", err);
    }
    clearAuth();
  };

  const value = {
    user,
    accessToken,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
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
