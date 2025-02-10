"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { BACKEND_URL } from "@/configs/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Mail, BookMarked } from "lucide-react";
import axios from "axios";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";

export default function EventComponent() {
  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState(null);
  const { accessToken } = useAuth();
  const router = useRouter()

  useEffect(() => {
    if(!accessToken){
      if (user) {
        router.push("/signin");
      }
    }
  })

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

    getAllEvents();
  }, [accessToken]);

  /* Events Rendering */
  const renderEventCard = (event) => (
    <Card
      key={event.id}
      className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Profile Section */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative h-12 w-12 min-w-[48px] rounded-full overflow-hidden">
              <Image
                src="/placeholder.svg"
                alt="Event Image"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-lg sm:text-xl">
                {event.eventTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {event.eventLink}
              </p>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                {event.eventDescription}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center sm:gap-2 md:gap-3 w-full sm:w-auto sm:justify-start mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shrink-0 w-full sm:w-auto"
              disabled
            >
              {/* <Mail className="h-4 w-4 md:mr-2" /> */}
              <span className="block md:inline-block text-sm">
                More Details
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-full mx-auto h-full">
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

          {/* Render Events with Preloader */}
          <div className="grid gap-4">
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
