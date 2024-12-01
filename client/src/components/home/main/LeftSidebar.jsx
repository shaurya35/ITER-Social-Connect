import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookMarked,
  FileText,
  Settings,
  Users,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

export default function LeftSidebar() {
  return (
    <>
      <aside className="w-64 lg:flex-shrink-0">
        <Card className="bg-white dark:bg-gray-800 overflow-hidden mb-4">
          <CardContent className="p-0">
            <div className="relative h-32">
              <Image
                src="/placeholder.svg"
                alt="Cover"
                //   height={128}
                //   width={256}
                priority
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="p-4 pt-14 relative">
              <div className="absolute -top-12 left-4 w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                <Image
                  src="/placeholder.svg"
                  alt="Avatar"
                  //   height={80}
                  //   width={80}
                  layout="fill"
                  objectFit="cover"
                  priority
                />
              </div>
              <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                John Doe
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                500 Followers
              </p>
            </div>
          </CardContent>
        </Card>
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
