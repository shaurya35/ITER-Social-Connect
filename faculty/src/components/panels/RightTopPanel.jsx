import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function RightTopPanel({
  placeholder,
  buttonLabel,
  buttonIcon: Icon,
  onButtonClick,
  disabled,
}) {
  return (
    <Card className="bg-white dark:bg-gray-800 mb-4 shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="search"
              disabled={disabled}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 rounded-full text-sm 
              bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 
              focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500/50 
              dark:focus:ring-blue-400/50 transition-all duration-200 hover:bg-white dark:hover:bg-gray-600"
            />
          </div>

          {/* Button with Icon */}
          <Button
            disabled={disabled}
            onClick={onButtonClick}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white 
            shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span className="hidden md:inline-block text-sm">{buttonLabel}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
