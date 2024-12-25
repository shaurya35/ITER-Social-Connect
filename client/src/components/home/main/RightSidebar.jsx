import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Check, X } from "lucide-react";

export default function RightSidebar() {
  return (
    <aside className="w-full lg:w-96 lg:flex-1">
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

      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: "Tech Meetup 2024",
              description:
                "Join us for an evening of networking and tech talks!",
            },
            {
              title: "Web Dev Workshop",
              description:
                "Learn the latest web development techniques and tools.",
            },
          ].map((event, index) => (
            <div key={index} className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                {event.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {event.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Learn More
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
