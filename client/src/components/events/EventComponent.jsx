"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { BACKEND_URL } from "@/configs/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, BookMarked } from "lucide-react";
import axios from "axios";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";

export default function EventComponent() {
  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState(null);
  const { accessToken } = useAuth();
  const router = useRouter();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!accessToken) {
      router.push("/signin");
    }
  }, [accessToken, router]);

  const buttons = [
    {
      label: "Events",
      icons: BookMarked,
      showChevron: true,
      key: "events",
    },
  ];

  useEffect(() => {
    const getAllEvents = async () => {
      setEventLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/events`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        setEvents(response.data.events);
      } catch (error) {
        setEventError(error.message);
      } finally {
        setEventLoading(false);
      }
    };

    if (accessToken) {
      getAllEvents();
    }
  }, [accessToken]);

  /* Render an event card with expanded details */
  const renderEventCard = (event) => (
    <Card
      key={event.id}
      className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-200"
    >
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-2xl">
            {event.eventTitle}
          </h3>
          <p className="text-base text-gray-700 dark:text-gray-300">
            {event.eventDescription}
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-medium">Event Type:</span> {event.eventType}
            </p>
            <p>
              <span className="font-medium">Address:</span> {event.eventAddress}
            </p>
            <p>
              <span className="font-medium">Start Time:</span>{" "}
              {new Date(event.eventStartTime).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p>
              <span className="font-medium">End Time:</span>{" "}
              {new Date(event.eventEndTime).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p>
              <span className="font-medium">Time Remaining:</span> {event.timeRemaining}
            </p>
            <p>
              <span className="font-medium">Contact:</span> {event.eventContact}
            </p>
            {event.eventLink && (
              <p>
                <span className="font-medium">Link:</span>{" "}
                <a
                  href={event.eventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {event.eventLink}
                </a>
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              disabled
            >
              More Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-full mx-auto h-full p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <LeftPanel
          heading="Events"
          subheading="Showcase your skills!"
          buttons={buttons}
        />

        {/* Main Content */}
        <div className="flex-1">
          <RightTopPanel
            placeholder="Search events..."
            buttonLabel="Add Event"
            buttonIcon={UserPlus}
            onButtonClick={() => console.log("Add Event Clicked")}
            disabled={true}
          />

          {/* Render Events */}
          <div className="mt-6 grid gap-6">
            {eventLoading ? (
              <PanelsPreloader />
            ) : eventError ? (
              <p className="text-red-500">Failed to load events: {eventError}</p>
            ) : events.length > 0 ? (
              events.map((event) => renderEventCard(event))
            ) : (
              <p className="text-gray-500 text-center">No events found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
