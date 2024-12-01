"use client";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { LogoMobile } from "./logoMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users,
  Bell,
  Calendar,
  Settings,
  Search,
  Menu,
  Moon,
  Sun,
  User,
  Home,
  X,
  BookMarked,
  FileText,
} from "lucide-react";

export default function Navbar() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  // const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    // { icon: Home, label: "Home" },
    { icon: User, label: "Profile" },
    { icon: Users, label: "Connections" },
    { icon: Bell, label: "Notifications" },
    // { icon: Calendar, label: "Events" },
    { icon: FileText, label: "My Posts" },
    { icon: BookMarked, label: "Saved Events" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 h-full flex flex-row flex-wrap items-center justify-between">
          <div className="flex items-center justify-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="block lg:hidden">
                <LogoMobile />
              </div>
              <div className="hidden lg:block">
                <Logo />
              </div>
            </Link>
          </div>
          <div className="hidden lg:flex lg:flex-row lg:flex-wrap lg:space-x-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            {menuItems.slice(0, 3).map((item, index) => (
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
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            {/* <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <Logo />
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-gray-500">
                      <X className="h-6 w-6" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                    {menuItems.map((item, index) => (
                      <Button key={index} variant="ghost" size="lg" className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100">
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet> */}
          </div>
        </div>
      </header>
    </>
  );
}
