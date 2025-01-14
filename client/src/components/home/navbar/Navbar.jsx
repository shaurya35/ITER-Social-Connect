"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import Link from "next/link";
import { Logo } from "./logo";
import { LogoMobile } from "./logoMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users,
  Bell,
  Settings,
  Search,
  MessageCircle,
  Menu,
  Moon,
  Sun,
  User,
  X,
  Bookmark,
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [renderInput, setRenderInput] = useState(false);
  const searchInputRef = useRef(null);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setRenderInput(true), 200);
    } else {
      setRenderInput(false);
    }
  }, [isOpen]);

  const menuItems = [
    { icon: MessageCircle, label: "Messages" },
    { icon: Bell, label: "Notifications" },
    { icon: Settings, label: "Settings" },
    { icon: Users, label: "Connections" },
    { icon: Bookmark, label: "Saved Events" },
    { icon: User, label: "Profile" },
  ];

  if (loading) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm h-16 flex justify-center items-center">
        <p>Loading...</p>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 h-full flex flex-row flex-wrap items-center justify-between">
          <div className="flex items-center justify-center">
            <Link href="/explore" className="flex-shrink-0 flex items-center">
              <div className="block lg:hidden">
                <LogoMobile />
              </div>
              <div className="hidden lg:block">
                <Logo />
              </div>
            </Link>
          </div>
          <div className="hidden lg:flex lg:flex-row lg:flex-wrap lg:space-x-1">
            <div className="relative mr-4">
              <Input
                type="search"
                placeholder="Search..."
                className="w-40 lg:w-64 pl-10 pr-4 py-2 rounded-full text-sm bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-all duration-200 hover:bg-white dark:hover:bg-gray-600"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none transition-colors duration-200" />
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
            {user ? (
              // Show Logout button if user is logged in
              <Button
                size="sm"
                className="ml-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white hidden lg:block"
                onClick={logout}
              >
                Logout
              </Button>
            ) : (
              // Show Signin/Signup buttons if user is not logged in
              <>
                <Link href="/signin" passHref>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 hidden lg:block"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup" passHref>
                  <Button
                    size="sm"
                    className="ml-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white hidden lg:block"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle>Menu</SheetTitle>
                <nav className="flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="relative mb-7 mt-4">
                      {renderInput && (
                        <Input
                          ref={searchInputRef}
                          type="search"
                          placeholder="Search..."
                          className="w-full pl-10 pr-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          // onFocus={(e) => e.target.blur()}
                        />
                      )}
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                    {menuItems.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="lg"
                        className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center justify-center flex-col mb-10">
                    <div className="flex justify-center items-center pb-5">
                      {user ? (
                        <Link href="/explore" passHref>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 "
                            onClick={() => {
                              setIsOpen(false);
                              logout();
                              Router.push("/explore")
                            }}
                          >
                            Logout?
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/signin" passHref>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 "
                            onClick={() => setIsOpen(false)}
                          >
                            Sign in?
                          </Button>
                        </Link>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-500"
                    >
                      <X className="h-6 w-6" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
