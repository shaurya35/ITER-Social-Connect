"use client";

/**
 *
 *
 *
 * 4. Save the scroll state
 *
 */

/** Imports */
import { useEffect, useState, useRef, useCallback } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { useProfile } from "@/contexts/ProfileContext";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { useTheme } from "@/contexts/ThemeContext";
import { useProfileNavigation } from "@/contexts/ProfileNavigation";
import { BACKEND_URL } from "@/configs/index";
import axios from "axios";
import PostsPreloader from "@/components/preloaders/PostsPreloader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "react-responsive";
import {
  Image,
  MessageCircleMore,
  Forward,
  ThumbsUp,
  Bookmark,
  BookmarkCheck,
  Loader2,
  BadgeCheck,
  Tag,
  Brain,
  Globe,
  Smartphone,
  Cloud,
  Shield,
  Database,
  Settings,
  Link2,
  ImageIcon,
  ChevronDown,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

/**
 * Time Handler Function
 */
export const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "1 min ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return `${years} years ago`;
};

const formatLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      try {
        const url = new URL(part);
        let host = url.hostname.replace("www.", "");
        const domainParts = host.split(".");
        const domainName =
          domainParts.length > 1
            ? domainParts[domainParts.length - 2]
            : domainParts[0];

        // Capitalize first letter
        const displayName =
          domainName.charAt(0).toUpperCase() + domainName.slice(1);

        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline"
            onClick={(e) => e.stopPropagation()}
          >
            {displayName}
          </a>
        );
      } catch (e) {
        return part;
      }
    }
    return part;
  });
};

const categories = [
  { value: "general", label: "General", icon: <Tag className="h-4 w-4" /> },
  { value: "aiml", label: "AI/ML", icon: <Brain className="h-4 w-4" /> },
  { value: "webdev", label: "Web Dev", icon: <Globe className="h-4 w-4" /> },
  {
    value: "mobile",
    label: "Mobile",
    icon: <Smartphone className="h-4 w-4" />,
  },
  { value: "cloud", label: "Cloud", icon: <Cloud className="h-4 w-4" /> },
  {
    value: "cybersecurity",
    label: "Security",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    value: "datascience",
    label: "Data Science",
    icon: <Database className="h-4 w-4" />,
  },
  { value: "devops", label: "DevOps", icon: <Settings className="h-4 w-4" /> },
  {
    value: "blockchain",
    label: "Blockchain",
    icon: <Link2 className="h-4 w-4" />,
  },
];

export default function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [newPostContent, setNewPostContent] = useState("");
  const [fetchingUser, setFetchingUser] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [likeLoadingState, setLikeLoadingState] = useState({});
  const [likeError, setLikeError] = useState(null);
  const [bookmarkLoadingState, setBookmarkLoadingState] = useState({});
  const [bookmarkError, setBookmarkError] = useState(null);
  const { accessToken } = useAuth();
  const { profile } = useProfile();
  const { isDarkMode } = useTheme();
  const redirectToProfile = useProfileNavigation();
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [categoriesPosting, setCategoriesPosting] = useState(categories[0]);

  // Ref for the sentinel element used for infinite scrolling
  const sentinelRef = useRef(null);
  // Ref to track if a fetch is in progress
  const isFetchingRef = useRef(false);
  // Ref to throttle observer triggers (in milliseconds)
  const lastTriggerTimeRef = useRef(0);

  // Once the profile is loaded, mark fetchingUser as false.
  useEffect(() => {
    if (profile) {
      setFetchingUser(false);
    }
  }, [profile]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handlePostSubmit();
    }
  };

  // /* Fetch The User Feed */
  // const fetchPosts = useCallback(async () => {
  //   if (isFetchingRef.current || !hasMore) return;
  //   isFetchingRef.current = true;
  //   setLoading(true);
  //   try {
  //     const response = await axios.get(`${BACKEND_URL}/api/feed`, {
  //       params: { page, limit: 10 },
  //       withCredentials: true,
  //       headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  //     });

  //     const newPosts = response.data.posts || [];
  //     const currentUserId = profile?.userId;

  //     // Process posts with category filtering
  //     const processedPosts = newPosts.map((post) => ({
  //       ...post,
  //       isLiked: Array.isArray(post.likes)
  //         ? post.likes.includes(currentUserId)
  //         : false,
  //       likeCount:
  //         post.likeCount ?? (Array.isArray(post.likes) ? post.likes.length : 0),
  //       category: post.category || "general",
  //     }));

  //     setPosts((prev) => [...prev, ...processedPosts]);
  //     setHasMore(response.data.hasMore);
  //   } catch (err) {
  //     setError(err);
  //   } finally {
  //     isFetchingRef.current = false;
  //     setLoading(false);
  //   }
  // }, [page, accessToken, profile?.userId]);

  /* Fetch The User Feed */
  const fetchPosts = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await axios.get(`${BACKEND_URL}/api/feed`, {
        params: { page, limit: 10 },
        withCredentials: true,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      const newPosts = response.data.posts || [];

      // SIMPLE processing - backend provides isLiked
      const processedPosts = newPosts.map((post) => ({
        ...post,
        category: post.category || "general",
      }));

      setPosts((prev) => [...prev, ...processedPosts]);
      setHasMore(response.data.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [page, accessToken]);

  // Filter posts based on selected category
  const filteredPosts = posts.filter((post) => {
    if (selectedCategory === "alumni") {
      return post.role === "alumni";
    } else if (selectedCategory === "teacher") {
      return post.role === "teacher";
    } else if (
      [
        "general",
        "aiml",
        "webdev",
        "mobile",
        "cloud",
        "cybersecurity",
        "datascience",
        "devops",
        "blockchain",
      ].includes(selectedCategory)
    ) {
      return post.category === selectedCategory;
    }

    return true;
  });

  // Updated category change handler
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // No need to reset posts/page since we're filtering client-side
  };
  // Add near your other hooks
  const navRef = useRef(null);

  // Add this useEffect hook
  useEffect(() => {
    const handleWheel = (e) => {
      const container = navRef.current;
      if (container && Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

      if (container) {
        container.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    const container = navRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);

  /* Update posts mapping once profile is available (or changes) */
  useEffect(() => {
    const currentUserId = profile?.userId || profile?.id;
    if (currentUserId) {
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          const computedIsLiked = Array.isArray(post.likes)
            ? post.likes.includes(currentUserId)
            : false;
          if (computedIsLiked !== post.isLiked) {
            return { ...post, isLiked: computedIsLiked };
          }
          return post;
        })
      );
    }
  }, [profile]);

  /* Fetch posts when page changes */
  useEffect(() => {
    fetchPosts();
  }, [page, fetchPosts]);

  /* Infinite Scroll using a sentinel element with throttle and disconnect */
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          const now = Date.now();
          // Throttle: if the last trigger was less than 1 second ago, do nothing
          if (now - lastTriggerTimeRef.current < 1000) return;
          lastTriggerTimeRef.current = now;
          obs.disconnect(); // Disconnect to prevent immediate re-triggering
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 200px 0px" }
    );
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [loading, hasMore]);

  /* Post Creation */
  const handlePostSubmit = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    let processedContent = newPostContent.trim();
    if (categoriesPosting.value !== "general") {
      const categoryHashtag = `#${categoriesPosting.value}`;
      if (!processedContent.includes(categoryHashtag)) {
        processedContent += `\n${categoryHashtag}`;
      }
    }
    const tempPost = {
      id: "temp",
      userName: profile.name,
      content: processedContent,
      profilePicture: profile.profilePicture,
      likes: [],
      likeCount: 0,
      createdAt: new Date().toISOString(),
      category: categoriesPosting.value,
    };
    setNewPostContent("");
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/post`,
        {
          profilePicture: profile.profilePicture,
          content: processedContent,
          content: processedContent,
          category: categoriesPosting.value,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      const { postId } = response.data;
      setPosts((prevPosts) => [
        { ...tempPost, id: postId },
        ...prevPosts.filter((post) => post.id !== "temp"),
      ]);
    } catch (err) {
      console.error("Error creating new post:", err);
      alert("Failed to post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  /* Like Service with Optimistic Update */
  // const toggleLike = async (postId) => {
  //   if (!accessToken) router.push("/signup");
  //   setPosts((prevPosts) =>
  //     prevPosts.map((post) => {
  //       if (post.id === postId) {
  //         const newCount = post.isLiked
  //           ? post.likeCount - 1
  //           : post.likeCount + 1;
  //         return { ...post, isLiked: !post.isLiked, likeCount: newCount };
  //       }
  //       return post;
  //     })
  //   );
  //   try {
  //     const response = await axios.post(
  //       `${BACKEND_URL}/api/user/posts/like`,
  //       { postId },
  //       {
  //         headers: { Authorization: `Bearer ${accessToken}` },
  //         withCredentials: true,
  //       }
  //     );
  //     const serverCount = response.data.totalLikes;
  //     setPosts((prevPosts) =>
  //       prevPosts.map((post) =>
  //         post.id === postId ? { ...post, likeCount: serverCount } : post
  //       )
  //     );
  //   } catch (error) {
  //     setPosts((prevPosts) =>
  //       prevPosts.map((post) =>
  //         post.id === postId
  //           ? {
  //               ...post,
  //               isLiked: !post.isLiked,
  //               likeCount: post.isLiked
  //                 ? post.likeCount - 1
  //                 : post.likeCount + 1,
  //             }
  //           : post
  //       )
  //     );
  //     setLikeError(
  //       error.response?.data?.message || "Failed to like/unlike the post"
  //     );
  //   } finally {
  //     setLikeLoadingState((prev) => ({ ...prev, [postId]: false }));
  //   }
  // };

  const toggleLike = async (postId) => {
    if (!profile) router.push("/signup");
    setLikeLoadingState((prev) => ({ ...prev, [postId]: true }));

    try {
      // SIMPLE optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          const newIsLiked = !post.isLiked;
          const newLikeCount = newIsLiked
            ? post.likeCount + 1
            : post.likeCount - 1;

          return {
            ...post,
            isLiked: newIsLiked,
            likeCount: newLikeCount,
          };
        })
      );

      // API call
      await axios.post(
        `${BACKEND_URL}/api/user/posts/like`,
        { postId },
        {
          withCredentials: true,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );
    } catch (err) {
      // SIMPLE revert on error
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return { ...post };
        })
      );

      console.error("Like Error:", err);
    } finally {
      setLikeLoadingState((prev) => ({ ...prev, [postId]: false }));
    }
  };

  /* Bookmark Service */
  const toggleBookmark = async (postId) => {
    if (!accessToken) router.push("/signup");
    setBookmarkLoadingState((prev) => ({ ...prev, [postId]: true }));
    setBookmarkError(null);
    try {
      await axios.post(
        `${BACKEND_URL}/api/user/post/${postId}/bookmark`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, isBookmarked: !post.isBookmarked }
            : post
        )
      );
    } catch (error) {
      setBookmarkError(error.response?.data?.message || "Failed to bookmark");
    } finally {
      setBookmarkLoadingState((prev) => ({ ...prev, [postId]: false }));
    }
  };

  /* Share Service using POST route */
  const sharePost = async (postId) => {
    if (!accessToken) {
      router.push("/signup");
      return;
    }
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/post/share`,
        { postId },
        {
          withCredentials: true,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );
      const { directLink, whatsappLink } = response.data;
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post",
          text: "I thought you might like this post:",
          url: directLink,
        });
      } else {
        const shareChoice = window.confirm(
          "Share via WhatsApp? Press OK for WhatsApp, or Cancel to copy the direct link."
        );
        if (shareChoice) {
          window.open(whatsappLink, "_blank");
        } else {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(directLink);
            alert("Direct link copied to clipboard!");
          } else {
            prompt("Copy this link:", directLink);
          }
        }
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      alert("Failed to generate share links. Please try again.");
    }
  };

  /* Artificial Delay (if needed) */
  const delay = () => new Promise((resolve) => setTimeout(resolve, 10000));

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto space-y-4">
      <div className="z-50 bg-white dark:bg-gray-800 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="relative group">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-20" />
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div
            className="flex space-x-2 overflow-x-auto pb-2 px-4 scroll-container"
            ref={navRef}
            style={{ scrollbarWidth: "thin" }}
          >
            {/* General Button */}
            <button
              onClick={() => setSelectedCategory("general")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
      ${
        selectedCategory === "general"
          ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      }`}
            >
              General
            </button>

            {/* Teacher Posts Button */}
            <button
              onClick={() => setSelectedCategory("teacher")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
      ${
        selectedCategory === "teacher"
          ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      }`}
            >
              Teacher 
            </button>

            {/* Alumni Posts Button */}
            <button
              onClick={() => setSelectedCategory("alumni")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
      ${
        selectedCategory === "alumni"
          ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      }`}
            >
              Alumni 
            </button>

            {/* Remaining Categories (excluding "general") */}
            {categories
              .filter((category) => category.value !== "general")
              .map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
          ${
            selectedCategory === category.value
              ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
                >
                  {category.label}
                </button>
              ))}
          </div>
        </div>
      </div>
      {/* Error message */}
      {/* {error && (
        <p className="text-red-500">Error loading posts: {error.message}</p>
      )} */}

      {/* Post creation */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Profile image remains unchanged */}
            {loading ? (
              <div className="bg-gray-300 dark:bg-gray-700 animate-pulse rounded-full transition-all duration-700 w-10 h-10"></div>
            ) : (
              <NextImage
                src={
                  profile?.profilePicture ||
                  "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"
                }
                alt="Avatar"
                width={40}
                height={40}
                className="rounded-full"
                priority
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  width: "40px",
                  height: "40px",
                }}
              />
            )}
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                // onKeyDown={(e) => {
                //   if (e.key === "Enter" && !e.shiftKey) {
                //     e.preventDefault();
                //     handlePostSubmit();
                //   }
                // }}
                onKeyDown={(e) => handleKeyDown(e)}
                className="resize-y bg-gray-100 min-h-[100px] dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-y-auto"
              />
              <div className="mt-4 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                <div className="w-full md:w-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    disabled
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </Button>

                  <div className="relative w-full md:w-[160px]">
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className={`w-full h-9 px-3 flex items-center justify-between rounded-md border ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300"
                          : "bg-white border-gray-300 hover:border-gray-400 text-gray-600"
                      } transition-colors`}
                    >
                      <span>{categoriesPosting.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div
                        className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${
                          isDarkMode
                            ? "bg-gray-800 border border-gray-700"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <div className="py-1">
                          {categories.map((category) => (
                            <button
                              key={category.value}
                              onClick={() => {
                                setCategoriesPosting(category);
                                setIsOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-sm flex items-center gap-2 ${
                                isDarkMode
                                  ? "hover:bg-gray-700 text-gray-300"
                                  : "hover:bg-gray-100 text-gray-600"
                              }`}
                            >
                              {category.icon}
                              {category.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post button remains unchanged */}
                <Button
                  size="sm"
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  onClick={handlePostSubmit}
                  disabled={fetchingUser || isPosting}
                >
                  {isPosting ? "Posting..." : fetchingUser ? "Post" : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preloader for a single post */}
      {isPosting && (
        <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-700 animate-pulse">
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
      )}

      {/* Initial Preloader */}
      {loading && <PostsPreloader />}

      {/* Error message */}
      {error && (
        <p className="text-red-500">Error loading posts: {error.message}</p>
      )}

      {/* Posts */}
      {filteredPosts.map((post, index) => {
        const uniqueKey = post.id ? `${post.id}-${index}` : index;
        return (
          <Card
            className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer relative mb-4"
            key={uniqueKey}
          >
            <CardHeader
              className="flex-row items-center gap-4 p-4 lg:px-5 lg:pt-4"
              onClick={() => router.push(`/post/${post.id}`)}
            >
              <NextImage
                src={
                  post.profilePicture ||
                  "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"
                }
                alt="Avatar"
                width={48}
                height={48}
                className="rounded-full"
                priority
                onClick={() => redirectToProfile(post.userId)}
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  width: "48px",
                  height: "48px",
                }}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {post.userName}
                  </h3>
                  {post.role === "teacher" ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Professor
                      </span>
                    </span>
                  ) : post.role === "alumni" ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        Alumni
                      </span>
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {timeAgo(post.createdAt)}
                </p>
              </div>
            </CardHeader>
            <CardContent
              className="px-4 py-3 lg:px-5 lg:pb-5 w-full"
              onClick={() => router.push(`/post/${post.id}`)}
            >
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">
                {formatLinks(post.content)}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-200 dark:border-gray-700 p-2">
              <div className="flex justify-between w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(post.id);
                  }}
                  disabled={likeLoadingState[post.id]}
                >
                  {likeLoadingState[post.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp
                      className={`h-4 w-4 ${
                        post.isLiked ? "text-blue-600" : ""
                      }`}
                    />
                  )}
                  <span>{post.likeCount}</span>
                  {likeError && (
                    <p className="text-red-500 text-sm mt-2">{likeError}</p>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  <MessageCircleMore className="h-4 w-4" />
                  <div className="hidden md:block">Comments</div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    sharePost(post.id);
                  }}
                >
                  <Forward className="h-4 w-4" />
                  <div className="hidden md:block">Share</div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => toggleBookmark(post.id)}
                  disabled={bookmarkLoadingState[post.id]}
                >
                  {bookmarkLoadingState[post.id] ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  ) : post.isBookmarked ? (
                    <BookmarkCheck className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Bookmark className="h-5 w-5 hover:text-gray-700" />
                  )}
                  <div className="hidden md:block">Bookmark</div>
                  {bookmarkError && (
                    <p className="text-red-500 text-sm mt-2">{bookmarkError}</p>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}

      {/* No Posts Message - Add this */}
      {filteredPosts.length === 0 && !loading && (
        <p className="text-center py-4 text-gray-500">
          No posts found in{" "}
          {categories.find((c) => c.value === selectedCategory)?.label} category
        </p>
      )}

      {/* Sentinel element for infinite scrolling with a set height */}
      <div ref={sentinelRef} style={{ height: "20px" }} />

      {loading && hasMore && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600 dark:border-gray-300"></div>
        </div>
      )}
      {!hasMore && (
        <p className="flex justify-center align-center ">
          No more posts to load.
        </p>
      )}
    </div>
  );
}
