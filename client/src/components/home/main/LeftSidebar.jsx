"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NextImage from "next/image";
import { useAuth } from "@/contexts/AuthProvider";
import axios from "axios";
import {
  BookMarked,
  FileText,
  Settings,
  Users,
  ChevronRight,
  Bell,
  MessageCircle,
  User,
  Bookmark,
} from "lucide-react";

export default function LeftSidebar() {
  const [username, setUsername] = useState("Explorer");
  const [connections, setConnections] = useState("No Connections");
  const [loading, setLoading] = useState(true); 
  const { user, accessToken } = useAuth();

  useEffect(() => {
    if (user && accessToken) {
      setLoading(true);
      axios
        .get("http://localhost:8080/api/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const { name, connectionsCount } = response.data;
          setUsername(name || "Explorer");
          setConnections(
            connectionsCount > 0
              ? `${connectionsCount} Connections`
              : "No Connections"
          );
        })
        .catch((error) => {
          console.error("Error fetching user details:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setUsername("Explorer");
      setConnections("No Connections");
      setLoading(false); 
    }
  }, [user, accessToken]);

  const menuItems = [
    { icon: User, label: "Profile" },
    { icon: MessageCircle, label: "Messages" },
    { icon: Bell, label: "Notifications" },
    { icon: Bookmark, label: "Saved Events" },
    { icon: Users, label: "Connections" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <aside className="w-64 lg:flex-shrink-0">
        <Card className="bg-white dark:bg-gray-800 overflow-hidden mb-3">
          <CardContent className="p-0">
            {/* Banner */}
            <div className="relative h-32">
              {loading ? (
                <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 animate-pulse transition-all duration-700"></div>
              ) : (
                <NextImage
                  src="/placeholder.svg"
                  alt="Cover"
                  priority
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              )}
            </div>
            <div className="p-4 pt-12 relative">
              {/* Profile Photo */}
              <div className="absolute -top-12 left-4 w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                {loading ? (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-700 animate-pulse rounded-full transition-all duration-700"></div>
                ) : (
                  <NextImage
                    src="https://media.discordapp.net/attachments/1315342834278207540/1315347576207179818/3.jpg?ex=67590ea4&is=6757bd24&hm=bb7466b04c2baa14bf93ec2d056530e0cfc2c5346c8222b1c57bd59299e785e7&=&format=webp&width=460&height=465"
                    alt="Avatar"
                    priority
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 460px"
                    style={{
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                )}
              </div>
              {/* Name */}
              {loading ? (
                <div className="mt-8">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse transition-all duration-700"></div>
                </div>
              ) : (
                <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 ">
                  {username}
                </h2>
              )}
              {/* Connections */}
              {loading ? (
                <div className="mt-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse transition-all duration-700"></div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {connections}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="h-11 dark:bg-gray-800 bg-white rounded-lg shadow mb-4 flex justify-evenly items-center">
          {menuItems.slice(0, 4).map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Button>
          ))}
        </div>

        <nav className="space-y-1 bg-white dark:bg-gray-800 rounded-lg shadow">
          {[
            { icon: FileText, label: "My Posts" },
            { icon: Users, label: "Connections" },
            { icon: BookMarked, label: "Events" },
            { icon: Settings, label: "Settings" },
          ].map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Button>
          ))}
        </nav>
      </aside>
    </>
  );
}
