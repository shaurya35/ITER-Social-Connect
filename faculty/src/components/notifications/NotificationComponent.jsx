"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  connection_request: {
    icon: "🤝",
    label: "New Connection",
    style: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  comment: {
    icon: "💬",
    label: "comment",
    style: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  like: {
    icon: "❤️",
    label: "like",
    style: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  default: {
    icon: "🤝",
    label: "New Connection",
    style: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

export default function NotificationComponent() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDocId, setLastDocId] = useState(null);
  const { accessToken } = useAuth();
  const router = useRouter();
  const observer = useRef();
  const POST_URL = (process.env.NEXT_PUBLIC_POST_URL || "https://iterconnect.live/").replace(/\/?$/, "/");

  useEffect(() => {
    if (!accessToken) router.push("/signin");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [accessToken, router]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
        params: { limit: 10 },
      });
      setNotifications(response.data.notifications);
      setHasMore(response.data.hasMore);
      setLastDocId(response.data.lastDocId);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDocId) return;

    setLoadingMore(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
        params: { 
          limit: 10,
          lastDocId
        },
      });
      setNotifications(prev => [...prev, ...response.data.notifications]);
      setHasMore(response.data.hasMore);
      setLastDocId(response.data.lastDocId);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingMore(false);
    }
  }, [accessToken, hasMore, lastDocId, loadingMore]);

  // Initial load
  useEffect(() => {
    if (accessToken) fetchNotifications();
  }, [accessToken, fetchNotifications]);

  // Infinite scroll setup
  const lastNotificationRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMore]);

  const buttons = [
    {
      label: "Notifications",
      icons: Bell,
      showChevron: true,
      key: "notifications",
    },
  ];

  const renderNotificationCard = (notification, index) => {
    const timeAgo = getTimeAgo(new Date(notification.date));
    const typeMeta = notificationTypeMeta[notification.type] || notificationTypeMeta.default;

    function formatMessageSmart(text, postId) {
      if (!postId || !text.includes("View Post")) return text;

      const finalLink = `${POST_URL}post/${postId}`;
      return text.replace(
        "View Post",
        `<a href="${finalLink}" class="text-blue-500 hover:underline" target="_self" rel="noopener noreferrer">View Post</a>`
      );
    }

    const isLast = index === notifications.length - 1;

    return (
      <Card
        key={notification.id}
        ref={isLast ? lastNotificationRef : null}
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
                className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${typeMeta.style}`}
              >
                {typeMeta.icon}
                <span className="capitalize">{typeMeta.label}</span>
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
              notifications.map((notification, index) =>
                renderNotificationCard(notification, index)
              )
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Bell className="mx-auto h-10 w-10 opacity-50 mb-2" />
                <p>No notifications yet. You&apos;re all caught up!</p>
              </div>
            )}

            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600 dark:border-gray-300"></div>
              </div>
            )}

            {!loading && !hasMore && notifications.length > 0 && (
              <p className="text-center text-gray-500 py-4">
                No more notifications to load.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}