// import { BACKEND_URL } from "./index"

// // API configuration
// export const API_CONFIG = {
//   // BACKEND_URL: BACKEND_URL || "http://localhost:8080",
//   BACKEND_URL: BACKEND_URL ,
//   ENDPOINTS: {
//     AUTH: {
//       ME: "/api/auth/me",
//       SIGNIN: "/api/auth/signin",
//       REGISTER: "/api/auth/register",
//     },
//     CHAT: {
//       CONVERSATIONS: "/api/chat/conversations",
//       MESSAGES: "/api/chat/messages",
//     },
//   },
// }

// // Helper function to get auth headers
// export const getAuthHeaders = (token) => {
//   return {
//     "Content-Type": "application/json",
//     ...(token && { Authorization: `Bearer ${token}` }),
//   }
// }


import { BACKEND_URL } from "./index";

// API configuration
export const API_CONFIG = {
  BACKEND_URL: BACKEND_URL,
  ENDPOINTS: {
    AUTH: {
      ME: `${BACKEND_URL}/api/auth/me`,
      SIGNIN: `${BACKEND_URL}/api/auth/signin`,
      REGISTER: `${BACKEND_URL}/api/auth/register`,
    },
    CHAT: {
      CONVERSATIONS: `${BACKEND_URL}/api/chat/conversations`,
      CREATE_CONVERSATION: `${BACKEND_URL}/api/chat/conversations/create`,
      MESSAGES: `${BACKEND_URL}/api/chat/messages`,
    },
  },
};

// Helper function to get auth headers
export const getAuthHeaders = (token) => {
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

