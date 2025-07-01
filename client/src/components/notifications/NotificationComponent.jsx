// "use client";

// import { useState, useEffect } from "react";
// import { useAuth } from "@/contexts/AuthProvider";
// import { useRouter } from "next/navigation";
// import { BACKEND_URL } from "@/configs/index";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Bell, Clock } from "lucide-react"; // Using Bell as a notification icon
// import axios from "axios";
// import LeftPanel from "@/components/panels/LeftPanel";
// import RightTopPanel from "@/components/panels/RightTopPanel";
// import PanelsPreloader from "../preloaders/PanelsPreloader";

// // Helper function to convert a date to a "time ago" string.
// function getTimeAgo(date) {
//   const now = new Date();
//   const secondsPast = (now.getTime() - date.getTime()) / 1000;

//   if (secondsPast < 60) {
//     return `${Math.floor(secondsPast)} seconds ago`;
//   }
//   if (secondsPast < 3600) {
//     return `${Math.floor(secondsPast / 60)} minutes ago`;
//   }
//   if (secondsPast < 86400) {
//     return `${Math.floor(secondsPast / 3600)} hours ago`;
//   }
//   if (secondsPast < 2592000) {
//     return `${Math.floor(secondsPast / 86400)} days ago`;
//   }
//   return date.toLocaleDateString();
// }

// export default function NotificationComponent() {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const { accessToken } = useAuth();
//   const router = useRouter();

//   // Redirect to signin if not authenticated
//   useEffect(() => {
//     if (!accessToken) {
//       router.push("/signin");
//     }
//   }, [accessToken, router]);

//   const buttons = [
//     {
//       label: "Notifications",
//       icons: Bell, // Notification icon
//       showChevron: true,
//       key: "notifications",
//     },
//   ];

//   useEffect(() => {
//     const getAllNotifications = async () => {
//       setLoading(true);
//       try {
//         const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//           withCredentials: true,
//         });
//         // Backend returns notifications with fields: id, type, message, date, and read.
//         // We'll keep these as-is and format them during rendering.
//         setNotifications(response.data.notifications);
//       } catch (error) {
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (accessToken) {
//       getAllNotifications();
//     }
//   }, [accessToken]);

//   /* Render each notification card with formatted fields */
//   const renderNotificationCard = (notification) => {
//     // Convert the ISO date string into a Date object and then to a "time ago" string
//     const notificationDate = new Date(notification.date);
//     const timeAgo = getTimeAgo(notificationDate);

//     // Use the notification type (capitalized) as a title; adjust as needed.
//     const title =
//       notification.type.charAt(0).toUpperCase() +
//       notification.type.slice(1) +
//       " Notification";

//     // The message from the backend becomes the description.
//     const description = notification.message;

//     return (
//       <Card
//         key={notification.id}
//         className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
//       >
//         <CardContent className="p-4">
//           <div className="flex flex-col gap-2">
//             <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg sm:text-xl">
//               {title}
//             </h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">
//               {description}
//             </p>
//             <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
//               <Clock className="h-4 w-4 mr-1" />
//               <span>{timeAgo}</span>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   };

//   return (
//     <div className="max-w-full mx-auto h-full">
//       <div className="flex flex-col lg:flex-row gap-6">
//         {/* Left Sidebar */}
//         <LeftPanel
//           heading="Notifications"
//           subheading="Stay updated with recent alerts!"
//           buttons={buttons}
//         />

//         {/* Main Content */}
//         <div className="flex-1">
//           <RightTopPanel
//             placeholder="Search notifications..."
//             buttonLabel="Mark All Read"
//             buttonIcon={Bell}
//             onButtonClick={() => console.log("Mark All Read Clicked")}
//             disabled={true}
//           />

//           {/* Render Notifications with Preloader */}
//           <div className="grid gap-4">
//             {loading ? (
//               <PanelsPreloader />
//             ) : error ? (
//               <p className="text-red-500">
//                 Failed to load notifications: {error}
//               </p>
//             ) : notifications.length > 0 ? (
//               notifications.map((notification) =>
//                 renderNotificationCard(notification)
//               )
//             ) : (
//               <p className="text-gray-500 text-center">
//                 No notifications found.
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/configs/index";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Clock } from "lucide-react";
import axios from "axios";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";

// Time ago formatter
function getTimeAgo(date) {
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;

  if (secondsPast < 60) return `${Math.floor(secondsPast)} seconds ago`;
  if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)} minutes ago`;
  if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)} hours ago`;
  if (secondsPast < 2592000)
    return `${Math.floor(secondsPast / 86400)} days ago`;
  return date.toLocaleDateString();
}

// Notification type metadata
const notificationTypeMeta = {
  connection_request: { icon: "🤝", color: "bg-blue-100 text-blue-800" },
  comment: { icon: "💬", color: "bg-green-100 text-green-800" },
  like: { icon: "❤️", color: "bg-pink-100 text-pink-800" },
};

export default function NotificationComponent() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { accessToken } = useAuth();
  const router = useRouter();
  const POST_URL = process.env.NEXT_PUBLIC_POST_URL;

  useEffect(() => {
    if (!accessToken) router.push("/signin");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [accessToken, router]);

  useEffect(() => {
    const getAllNotifications = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        setNotifications(response.data.notifications);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) getAllNotifications();
  }, [accessToken]);

  const buttons = [
    {
      label: "Notifications",
      icons: Bell,
      showChevron: true,
      key: "notifications",
    },
  ];

  const renderNotificationCard = (notification) => {
    const timeAgo = getTimeAgo(new Date(notification.date));
    const typeMeta = notificationTypeMeta[notification.type] || {
      icon: "🔔",
      color: "bg-gray-200 text-gray-700",
    };

    // function formatMessageSmart(text, postId) {
    //   const finalLink = `${POST_URL}post/${postId}`;
    //   if (!finalLink || !text.includes("View Post")) return text;

    //   return text.replace(
    //     "View Post",
    //     `<a href="${finalLink}" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">View Post</a>`
    //   );
    // }

    function formatMessageSmart(text, postId) {
      const finalLink = `${POST_URL}post/${postId}`;
      if (!postId || !text.includes("View Post")) return text;

      return text.replace(
        "View Post",
        `<a href="${finalLink}" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">View Post</a>`
      );
    }

    return (
      <Card
        key={notification.id}
        className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
      >
        <CardContent className="p-4 flex gap-4 items-start">
          <img
            src={
              notification.senderProfilePicture ||
              "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"
            }
            alt="Sender"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {notification.senderName || "Someone"}
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${typeMeta.color}`}
              >
                {typeMeta.icon} {notification.type.replace("_", " ")}
              </span>
            </div>

            <p
              className="text-sm text-gray-600 dark:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: formatMessageSmart(
                  notification.message,
                  notification.postId
                ),
              }}
            ></p>

            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <LeftPanel
          heading="Notifications"
          subheading="Stay updated with recent alerts!"
          buttons={buttons}
        />

        {/* Main Content */}
        <div className="flex-1">
          <RightTopPanel
            placeholder="Search notifications..."
            buttonLabel="Mark All Read"
            buttonIcon={Bell}
            onButtonClick={() => {}}
            disabled={true}
          />

          <div className="grid gap-4">
            {loading ? (
              <PanelsPreloader />
            ) : error ? (
              <p className="text-red-500">
                Failed to load notifications: {error}
              </p>
            ) : notifications.length > 0 ? (
              notifications.map((notification) =>
                renderNotificationCard(notification)
              )
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Bell className="mx-auto h-10 w-10 opacity-50 mb-2" />
                <p>No notifications yet. You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
