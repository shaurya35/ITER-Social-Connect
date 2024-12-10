import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NextImage from "next/image";
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
            <div className="relative h-32">
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
            </div>
            <div className="p-4 pt-12 relative">
              <div className="absolute -top-12 left-4 w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                <NextImage
                  src="https://media.discordapp.net/attachments/1315342834278207540/1315347576207179818/3.jpg?ex=67590ea4&is=6757bd24&hm=bb7466b04c2baa14bf93ec2d056530e0cfc2c5346c8222b1c57bd59299e785e7&=&format=webp&width=460&height=465"
                  alt="Avatar"
                  // width={460}
                  // height={465}
                  priority
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 460px"
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                    // width: "80px",
                    // height: "80px",
                  }}
                />
              </div>
              <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 ">
                Explorer
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No Followers
              </p>
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
