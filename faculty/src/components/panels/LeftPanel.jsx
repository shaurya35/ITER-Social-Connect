import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function LeftPanel({ heading, subheading, buttons }) {
  return (
    <div className="lg:w-1/4">
      {/* Heading & Subheading */}
      <Card className="bg-white dark:bg-gray-900 mb-4">
        <CardContent className="p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {heading}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {subheading}
          </p>
        </CardContent>
      </Card>

      {/* Buttons Section */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-0">
          <nav className="space-y-0.5">
            {buttons.map((button, index) => {
              const activeClasses = button.active
                ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100";
              return (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={button.onClick}
                  className={`w-full justify-between rounded-none ${activeClasses}`}
                >
                  <div className="flex items-center">
                    {button.icon && (
                      <button.icon className="mr-3 h-5 w-5" />
                    )}
                    {button.label}
                  </div>
                  {button.showChevron && <ChevronRight className="h-4 w-4" />}
                </Button>
              );
            })}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
