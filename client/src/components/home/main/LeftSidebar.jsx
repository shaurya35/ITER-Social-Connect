"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NextImage from "next/image";
import { useProfile } from "@/contexts/ProfileContext";
import { BACKEND_URL } from "@/configs/index";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
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
  Mail,
} from "lucide-react";

export default function LeftSidebar() {
  const { profile, loading } = useProfile();
  const router = useRouter();

  const { isDarkMode} = useTheme();

  const src = isDarkMode ? "/placeholder-banner-dark.png": "/placeholder-banner-light.png";

  const menuItems = [
    { icon: User, label: "Profile", route: "/profile" },
    // { icon: MessageCircle, label: "Messages", route: "/chat" },
    { icon: Bell, label: "Notifications", route: "/notifications" },
    { icon: Mail, label: "Messages", route: "/chat" },
    { icon: Bookmark, label: "Saved Posts", route: "/bookmarks" },
    { icon: Users, label: "Connections", route: "/connections" },
    { icon: Settings, label: "Settings", route: "/settings" },
  ];

  const handleNavigation = (route) => {
    router.push(route);
  };

  const handleBioNavigation = (route) => {
    if(!profile) {
      router.push('/signup')
      return
    }
    router.push(`/bio`);
  }

  return (
    <>
      <aside className="w-64 lg:flex-shrink-0">
        <Card className="bg-white dark:bg-gray-800 overflow-hidden mb-3 cursor-pointer"  onClick={() => handleBioNavigation()}>
          <CardContent className="p-0">
            {/* Banner */}
            <div className="relative h-32">
              {loading ? (
                <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 animate-pulse transition-all duration-700"></div>
              ) : (
                <NextImage
                  src={src}
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
                    src={
                      profile?.profilePicture ||
                      "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"
                    }
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
                  {profile?.name || "Explorer"}
                </h2>
              )}
              {/* Connections */}
              {loading ? (
                <div className="mt-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse transition-all duration-700"></div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile?.connectionsCount
                    ? `${profile.connectionsCount} Connections`
                    : "No Connections"}
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
              onClick={() => handleNavigation(item.route)}
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
              disabled={item.disabled}
              >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Button>
          ))}
        </div>

        <nav className="space-y-1 bg-white dark:bg-gray-800 rounded-lg shadow">
          {[
            { icon: FileText, label: "My Posts", route: "/profile" },
            { icon: Users, label: "Connections", route: "/connections" },
            { icon: BookMarked, label: "Events", route: "/events" },
            { icon: Settings, label: "Settings", route: "/settings" },
          ].map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={() => handleNavigation(item.route)}
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
