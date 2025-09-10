"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./logo";
import { LogoMobile } from "./logoMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users,
  Bell,
  Settings,
  Search,
  FileText,
  MessageCircle,
  BadgeInfo,
  Mail,
  Menu,
  Moon,
  Sun,
  User,
  X,
  Bookmark,
  Home,
} from "lucide-react";
import { debounce } from "lodash";
import { BACKEND_URL } from "@/configs";

export default function Navbar() {
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Existing states
  const [isOpen, setIsOpen] = useState(false);
  const [renderInput, setRenderInput] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, loading, logout, accessToken } = useAuth();
  const router = useRouter();

  const handleUserPresence = () => {
    if (!user) {
      router.push('/signup');
    }
  };

  // Optimized debounced search function
  const performSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${BACKEND_URL}/api/search?query=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          }
        );

        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();

        if (!controller.signal.aborted) {
          setSearchResults(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Search failed:", error);
          setSearchResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300),
    [accessToken]
  );

  // Cleanup effects
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && 
          !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleMobileClickOutside = (event) => {
      if (mobileSearchContainerRef.current && 
          !mobileSearchContainerRef.current.contains(event.target)) {
        setSearchResults(null);
      }
    };

    document.addEventListener("mousedown", handleMobileClickOutside);
    return () => document.removeEventListener("mousedown", handleMobileClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      performSearch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [performSearch]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setRenderInput(true), 200);
    } else {
      setRenderInput(false);
    }
  }, [isOpen]);

  const handleNavigation = (route) => {
    router.push(route);
  };

  const menuItems = [
    { icon: Home, label: "Home", route: "/explore" },
    { icon: Bell, label: "Notifications", route: "/notifications" },
    { icon: Mail, label: "Messages", route: "/chat" },
    { icon: Settings, label: "Settings", route: "/settings" },
    { icon: BadgeInfo, label: "About Us", route: "/team"},
    { icon: Users, label: "Connections", route: "/connections" },
    { icon: Bookmark, label: "Bookmarks", route: "/bookmarks" },
    { icon: User, label: "Profile", route: "/profile" },
  ];

  const phoneMenuItems = [
    // { icon: Home, label: "Home", route: "/explore" },
    { icon: User, label: "Profile", route: "/bio" },
    { icon: Mail, label: "Messages", route: "/chat" },
    { icon: Bell, label: "Notifications", route: "/notifications" },
    { icon: FileText, label: "My Posts", route: "/profile" },
    { icon: Users, label: "Connections", route: "/connections" },
    { icon: Bookmark, label: "Bookmarks", route: "/bookmarks" },
    { icon: Settings, label: "Settings", route: "/settings" },
    { icon: BadgeInfo, label: "About Us", route: "/team"},
  ];

  const SearchResultsDropdown = ({ results, isLoading, onClose }) => (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto transition-all duration-300 origin-top transform opacity-100 scale-y-100">
      <div className="p-2 border-b dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Search results
        </span>
        <button
          onClick={() => onClose()}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-150"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="p-4 text-center text-gray-500 animate-pulse">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent" />
            <span className="ml-2">Searching...</span>
          </div>
        </div>
      ) : results ? (
        <div className="divide-y dark:divide-gray-700">
          {results.users?.length > 0 && (
            <div className="p-2">
              <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Users
              </h3>
              {results.users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    setTimeout(() => router.push(`/profile/${user.id}`), 150);
                  }}
                >
                  <img
                    src={user.profilePicture || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full mr-3 object-cover transition-transform duration-150 hover:scale-105"
                  />
                  <div>
                    <div className="font-medium dark:text-gray-200">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {user.about}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.posts?.length > 0 && (
            <div className="p-2">
              <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Posts
              </h3>
              {results.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    setTimeout(() => router.push(`/post/${post.id}`), 150);
                  }}
                >
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {post.content.substring(0, 60)}
                    {post.content.length > 60 && "..."}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.hashtags?.length > 0 && (
            <div className="p-2">
              <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Hashtags
              </h3>
              {results.hashtags.map((hashtag) => (
                <button
                  key={hashtag}
                  className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400 transition-colors duration-150"
                  onClick={() => {
                    const tag = hashtag.startsWith("#") ? hashtag.slice(1) : hashtag;
                    setSearchQuery(`#${tag}`);
                    performSearch(tag);
                  }}
                >
                  #{hashtag}
                </button>
              ))}
            </div>
          )}

          {!results.users?.length &&
            !results.posts?.length &&
            !results.hashtags?.length && (
              <div className="p-4 text-center text-gray-500">
                No results found
              </div>
            )}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          Type to search users, posts, and hashtags
        </div>
      )}
    </div>
  );

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-2 h-full flex flex-row flex-wrap items-center justify-between">
          <div className="flex items-center justify-center">
            <Link href="/explore" className="flex-shrink-0 flex items-center">
              <div className="block lg:hidden">
                <LogoMobile />
              </div>
              <div className="hidden lg:block">
                <Logo />
              </div>
            </Link>
            <div className="hidden lg:flex lg:flex-row lg:flex-wrap lg:space-x-0">
              <div className="relative ml-4 mr-4" ref={searchContainerRef}>
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    performSearch(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (user) {
                      setIsFocused(true);
                      setIsSearchOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setIsFocused(false), 200);
                  }}
                  disabled={!user}
                  className={`w-40 lg:${
                    isFocused ? "w-64" : "w-48"
                  } pl-10 pr-4 py-2 rounded-full text-sm bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-all duration-300 ease-out`}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none transition-colors duration-200" />
                {isSearchOpen && (
                  <SearchResultsDropdown
                    results={searchResults}
                    isLoading={isLoading}
                    onClose={() => setIsSearchOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="hidden lg:flex lg:flex-row lg:flex-wrap lg:space-x-0">
              {menuItems.slice(0, 5).map((item, index) => (
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
            {user ? (
              <Button
                size="sm"
                className="ml-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white hidden lg:block"
                onClick={logout}
              >
                Logout
              </Button>
            ) : (
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
                  <div className="space-y-2">
                    <div className="relative mb-7 mt-4" ref={mobileSearchContainerRef}>
                      {renderInput && (
                        <div className="relative">
                          <Input
                            type="search"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              performSearch(e.target.value);
                            }}
                            className="w-full pl-10 pr-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                          {searchResults && (
                            <SearchResultsDropdown
                              results={searchResults}
                              isLoading={isLoading}
                              onClose={() => setSearchResults(null)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {phoneMenuItems.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="lg"
                        className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => {
                          setIsOpen(false);
                          handleNavigation(item.route);
                        }}
                        disabled={item.disabled}
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
                              router.push("/explore");
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