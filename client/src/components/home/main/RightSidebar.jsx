"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Check, X } from "lucide-react";
import axios from "axios";

export default function RightSidebar() {
  const [connections, setConnections] = useState([]);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const { accessToken } = useAuth();

  useEffect(() => {
    // const fetchConnections = () => {
    //   todo
    // }

    const fetchEvents = async () => {
      setEventLoading(true);
      try {
        const response = await axios.get("http://localhost:8080/api/event", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        setEvents(response.data.events);
      } catch (err) {
        setError(err);
      } finally {
        setEventLoading(false);
      }
    };

    if (accessToken) {
      // fetchConnections();
      fetchEvents();
    }
  }, [accessToken]);

  const handleShowMore = () => setShowAllEvents((prev) => !prev);

  // Artificial Delay for Testing
  const delay = () => {
    new Promise((resolve) => setTimeout(resolve, 10000));
  };

  return (
    <aside className="w-full lg:w-80 lg:flex-1">
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Connection Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "Alex Johnson", role: "Full Stack Developer" },
            { name: "Emily Chen", role: "UX Designer" },
          ].map((person, index) => (
            <div key={index} className="flex items-center gap-3">
              <Image
                src="/placeholder.svg"
                priority
                alt={person.name}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                  {person.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {person.role}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-2 py-1"
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Accept</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Ignore</span>
                </Button>
              </div>
            </div>
          ))}
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
          {eventLoading
            ? Array.from({ length: 2 }).map((_, index) => (
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
            : (showAllEvents ? events : events.slice(0, 2)).map(
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
        {error}
      </Card>
    </aside>
  );
}
