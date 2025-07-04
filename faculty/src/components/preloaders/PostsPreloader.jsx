import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function PostsPreloader() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, idx) => (
        <Card
          key={idx}
          className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-700 animate-pulse"
        >
          <CardHeader className="flex-row items-center gap-4 p-4">
            <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12"></div>
            <div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
