"use client";
/**
 * Updated: Integrated profile picture usage and connection request accept/reject actions.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { BACKEND_URL } from "@/configs/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  UserMinus,
  Mail,
  BookDown,
  Check,
  X,
  MessageCircle,
} from "lucide-react";
import axios from "axios";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";

export default function ConnectionsComponent() {
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("connections");

  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [errorConnections, setErrorConnections] = useState(null);
  const [errorRequests, setErrorRequests] = useState(null);

  const { accessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.push("/signin");
    }
  }, [accessToken, router]);

  const buttons = [
    {
      label: "My Network",
      icon: Users,
      onClick: () => setActiveTab("connections"),
      active: activeTab === "connections",
      showChevron: true,
      key: "connections",
    },
    {
      label: "Pending Requests",
      icon: BookDown,
      onClick: () => setActiveTab("requests"),
      active: activeTab === "requests",
      showChevron: true,
      key: "requests",
    },
  ];

  // Fetch all connections
  useEffect(() => {
    const getAllConnections = async () => {
      setLoadingConnections(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/connections`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          }
        );
        setConnections(response.data.connections);
        setErrorConnections(null);
      } catch (error) {
        setErrorConnections(error?.message || "Unexpected Error");
      } finally {
        setLoadingConnections(false);
      }
    };

    if (accessToken) getAllConnections();
  }, [accessToken]);

  // Fetch pending requests
  useEffect(() => {
    const getPendingConnections = async () => {
      setLoadingRequests(true);
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
        setRequests(response.data.requests);
        setErrorRequests(null);
      } catch (error) {
        setErrorRequests(error?.message || "Unexpected Error");
      } finally {
        setLoadingRequests(false);
      }
    };

    if (accessToken) getPendingConnections();
  }, [accessToken]);

  // Accept a pending connection request
  const handleAccept = async (request) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/connections/respond`,
        { targetEmail: request.email, action: "true" },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );
      // Add the accepted request to connections (update profile picture if returned)
      setConnections((prev) => [
        ...prev,
        {
          connectionId: request.requestId,
          userId: request.senderId,
          name: request.name,
          email: request.email,
          about: request.about,
          profilePicture: response.data.profilePicture || request.profilePicture,
        },
      ]);
      // Remove the request from pending list
      setRequests((prev) =>
        prev.filter((req) => req.requestId !== request.requestId)
      );
    } catch (error) {
      console.error("Error accepting request", error);
    }
  };

  // Handle message button click for pending requests (after accepting)
  const handleMessageFromRequest = (request) => {
    if (!request.senderId || !request.name) return;
    
    // Navigate to chat with the request sender
    router.push(`/chat?userId=${request.senderId}&userName=${encodeURIComponent(request.name)}`);
  };

  // Reject a pending connection request
  const handleReject = async (request) => {
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
      // Remove the request from pending list
      setRequests((prev) =>
        prev.filter((req) => req.requestId !== request.requestId)
      );
    } catch (error) {
      console.error("Error rejecting request", error);
    }
  };

  // Handle message button click
  const handleMessage = (connection) => {
    if (!connection.userId || !connection.name) return;
    
    // Navigate to chat with the connection
    router.push(`/chat?userId=${connection.userId}&userName=${encodeURIComponent(connection.name)}`);
  };

  // Render connection card for "My Network"
  const renderConnectionCard = (connection) => (
    <Card
      key={connection.connectionId}
      className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Profile Section */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative h-12 w-12 min-w-[48px] rounded-full overflow-hidden">
              <Image
                src={connection.profilePicture || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"}
                alt={connection.name|| "User name"}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-lg sm:text-xl">
                {connection.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {connection.email}
              </p>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                {connection.about}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center sm:gap-2 md:gap-3 w-full sm:w-auto sm:justify-start mt-4 sm:mt-0">
            <Button
              onClick={() => handleMessage(connection)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white shrink-0 w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 md:mr-2" />
              <span className="block sm:hidden md:inline-block text-sm">
                Message
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border border-red-500 bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 w-full sm:w-auto mt-2 sm:mt-0"
              disabled
            >
              <UserMinus className="h-4 w-4 md:mr-2" />
              <span className="block sm:hidden md:inline-block text-sm">
                Remove
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render request card for "Pending Requests"
  const renderRequestCard = (request) => (
    <Card
      key={request.requestId}
      className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Profile Section */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative h-12 w-12 min-w-[48px] rounded-full overflow-hidden">
              <Image
                src={request.profilePicture || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"}
                alt={request.name || " User name"}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-lg sm:text-xl">
                {request.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {request.email}
              </p>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                {request.about}
              </p>
            </div>
          </div>

          {/* Action Buttons for Pending Requests */}
          <div className="flex flex-row sm:flex-row items-center justify-end gap-1 md:gap-2 w-full sm:w-auto sm:justify-start mt-4 sm:mt-0">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
              onClick={() => handleMessageFromRequest(request)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="sr-only">Message</span>
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              onClick={() => handleAccept(request)}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Accept</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={() => handleReject(request)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Reject</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  let content;
  if (activeTab === "connections") {
    if (loadingConnections) {
      content = <PanelsPreloader />;
    } else if (errorConnections) {
      content = (
        <p className="text-center text-red-500">Error: {errorConnections}</p>
      );
    } else {
      content =
        connections.length > 0 ? (
          connections.map(renderConnectionCard)
        ) : (
          <p className="text-center text-gray-500">No connections found.</p>
        );
    }
  } else if (activeTab === "requests") {
    if (loadingRequests) {
      content = <PanelsPreloader />;
    } else if (errorRequests) {
      content = (
        <p className="text-center text-red-500">Error: {errorRequests}</p>
      );
    } else {
      content =
        requests.length > 0 ? (
          requests.map(renderRequestCard)
        ) : (
          <p className="text-center text-gray-500">
            No pending requests found.
          </p>
        );
    }
  }

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <LeftPanel
          heading="Connections"
          subheading="Manage your network"
          buttons={buttons}
        />

        {/* Main Content */}
        <div className="flex-1">
          <RightTopPanel
            placeholder="Search connections..."
            buttonLabel="Add Connection"
            buttonIcon={UserPlus}
            onButtonClick={() => console.log("Add Connection Clicked")}
            disabled={true}
          />

          {/* Render Content */}
          <div className="grid gap-4">{content}</div>
        </div>
      </div>
    </div>
  );
}
