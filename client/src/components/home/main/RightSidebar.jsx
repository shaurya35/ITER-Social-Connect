"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { BACKEND_URL } from "@/configs/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Check, X } from "lucide-react";
import axios from "axios";

export default function RightSidebar() {
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      setEventLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/events`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        setEvents(response.data.events);
      } catch (err) {
        setError(err?.message || "Error fetching events");
      } finally {
        setEventLoading(false);
      }
    };

    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/connections/requests`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          }
        );
        // Store all requests; we'll render only the first 2
        setRequests(response.data.requests);
      } catch (err) {
        setError(err?.message || "Error fetching connection requests");
      } finally {
        setRequestsLoading(false);
      }
    };

    if (accessToken) {
      fetchRequests();
      fetchEvents();
    }
  }, [accessToken]);

  const handleShowMore = () => setShowAllEvents((prev) => !prev);

  // Accept a connection request and remove it from the list
  const handleAcceptRequest = async (request) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/connections/respond`,
        { targetEmail: request.email, action: "true" },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );
      setRequests((prev) =>
        prev.filter((req) => req.requestId !== request.requestId)
      );
    } catch (error) {
      console.error("Error accepting connection request:", error);
    }
  };

  // Reject a connection request and remove it from the list
  const handleRejectRequest = async (request) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/connections/respond`,
        { targetEmail: request.email, action: "false" },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );
      setRequests((prev) =>
        prev.filter((req) => req.requestId !== request.requestId)
      );
    } catch (error) {
      console.error("Error rejecting connection request:", error);
    }
  };

  return (
    <aside className="w-full lg:w-72 lg:flex-1">
      {/* Connection Requests Card */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Connection Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : requests.length > 0 ? (
            requests.slice(0, 2).map((req) => (
              <div key={req.requestId} className="flex items-center gap-3">
                <Image
                  src={req.profilePicture || "/placeholder.svg"}
                  alt={req.name || "User profile image"}
                  width={40}
                  height={40}
                  // className="rounded-full flex-shrink-0"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                    {req.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {req.about || "No additional info"}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-2 py-1"
                    onClick={() => handleAcceptRequest(req)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Accept</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1"
                    onClick={() => handleRejectRequest(req)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Reject</span>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-left text-gray-500">
              No connection requests available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Events Section */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[45vh]">
          {eventLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-700 animate-pulse"
              >
                <CardHeader className="p-0 pt-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))
          ) : events.length === 0 ? (
            <p className="text-left text-gray-500">No upcoming events</p>
          ) : (
            (showAllEvents ? events : events.slice(0, 2)).map(
              (event, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                    {event.eventTitle}
                  </h4>
                  <p
                    className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {event.eventDescription}
                  </p>
                  <Button
                    as="a"
                    href={event.eventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Learn More
                  </Button>
                </div>
              )
            )
          )}
        </CardContent>
        {!eventLoading && events.length > 2 && (
          <div className="px-4 pb-4 text-center">
            <button
              onClick={handleShowMore}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAllEvents ? "Show Less" : "Show More"}
            </button>
          </div>
        )}
        {error && <p className="text-center text-red-500">{error}</p>}
      </Card>
    </aside>
  );
}
