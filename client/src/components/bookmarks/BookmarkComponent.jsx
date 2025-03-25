"use client";
/**
 * Todos: 1. Add Likes
 * 2. Add Share
 * 3. Bookmark system
 * 4. Infinite Scroll
 */

/** Imports */

import { useEffect, useState, useRef, useCallback } from "react";
import NextImage from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import PostsPreloader from "@/components/preloaders/PostsPreloader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Image,
  MessageCircleMore,
  Forward,
  ThumbsUp,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useProfile } from "@/contexts/ProfileContext";
import { BACKEND_URL } from "@/configs/index";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

// Time Handler for Posts
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

export default function BookmarkComponent() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [newPostContent, setNewPostContent] = useState("");
  const [fetchingUser, setFetchingUser] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  // Per-post loading states for like and bookmark actions
  const [likeLoadingStates, setLikeLoadingStates] = useState({});
  const [bookmarkLoadingStates, setBookmarkLoadingStates] = useState({});

  const { accessToken } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const observer = useRef();

  useEffect(() => {
    if (!profile) {
      router.replace("/signin");
    }
  });

  useEffect(() => {
    if (profile) {
      setFetchingUser(false);
    }
  }, [profile]);

  /* Fetch The Bookmarked Posts */
  const fetchPosts = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/posts/bookmarks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
        params: { page, limit: 10 },
      });
      // Assume the backend returns bookmarked posts in the "bookmarks" field.
      // Map each post so that:
      // - isBookmarked is always true on this page.
      // - likeCount is set based on either p.likeCount or the length of p.likes.
      // - isLiked is determined by whether p.likes includes the current user ID.
      const currentUserId = profile?.userId;
      const newPosts = (response.data.bookmarks || []).map((p) => ({
        ...p,
        isBookmarked: true,
        likeCount: p.likeCount !== undefined ? p.likeCount : (p.likes ? p.likes.length : 0),
        isLiked: p.likes ? p.likes.includes(currentUserId) : false,
      }));
      // Combine with previous posts and sort descending by createdAt
      setPosts((prevPosts) => {
        const combined = [...prevPosts, ...newPosts];
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return combined;
      });
      setHasMore(newPosts.length === 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, accessToken, profile]);

  /* Function to Fetch posts */
  useEffect(() => {
    fetchPosts();
  }, [page, fetchPosts]);

  /* Infinite Post Functionality */
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  /* Post Creation */
  // const handlePostSubmit = async () => {
  //   if (!newPostContent.trim()) return;

  //   setIsPosting(true);

  //   const tempPost = {
  //     id: "temp",
  //     userName: profile.name,
  //     content: newPostContent,
  //     profilePicture: profile.profilePicture,
  //     likeCount: 0,
  //     createdAt: new Date().toISOString(),
  //     isBookmarked: false,
  //     isLiked: false,
  //   };

  //   setNewPostContent("");

  //   try {
  //     const response = await axios.post(
  //       `${BACKEND_URL}/api/user/post`,
  //       { profilePicture: profile.profilePicture, content: newPostContent },
  //       {
  //         headers: { Authorization: `Bearer ${accessToken}` },
  //         withCredentials: true,
  //       }
  //     );

  //     const { postId } = response.data;

  //     setPosts((prevPosts) => [
  //       { ...tempPost, id: postId },
  //       ...prevPosts.filter((post) => post.id !== "temp"),
  //     ]);
  //   } catch (err) {
  //     console.error("Error creating new post:", err);
  //     alert("Failed to post. Please try again.");
  //   } finally {
  //     setIsPosting(false);
  //   }
  // };

  /* Like Functionality */
  const toggleLike = async (postId) => {
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) return;
    if (likeLoadingStates[postId]) return;

    setLikeLoadingStates((prev) => ({ ...prev, [postId]: true }));
    const originalPost = { ...posts[index] };
    const newIsLiked = !posts[index].isLiked;
    // Optimistic update: update isLiked and increment/decrement likeCount
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: newIsLiked, likeCount: newIsLiked ? p.likeCount + 1 : p.likeCount - 1 }
          : p
      )
    );
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/posts/like`,
        { postId },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      const totalLikes = response.data.totalLikes;
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, likeCount: totalLikes } : p))
      );
    } catch (error) {
      // Rollback on error
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? originalPost : p))
      );
    } finally {
      setLikeLoadingStates((prev) => ({ ...prev, [postId]: false }));
    }
  };

  /* Bookmark Functionality */
  const toggleBookmark = async (postId) => {
    const index = posts.findIndex((p) => p.id === postId);
    if (index === -1) return;
    if (bookmarkLoadingStates[postId]) return;

    setBookmarkLoadingStates((prev) => ({ ...prev, [postId]: true }));
    const originalPost = { ...posts[index] };
    const newIsBookmarked = !posts[index].isBookmarked;
    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId ? { ...p, isBookmarked: newIsBookmarked } : p
      )
    );
    try {
      await axios.post(
        `${BACKEND_URL}/api/user/post/${postId}/bookmark`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
    } catch (error) {
      // Rollback on error
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? originalPost : p))
      );
    } finally {
      setBookmarkLoadingStates((prev) => ({ ...prev, [postId]: false }));
    }
  };

  /* Share Functionality */
  const sharePost = async (postId) => {
    const postToShare = posts.find((p) => p.id === postId);
    if (!postToShare) return;
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/user/post/share`,
        { postId },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      const { directLink, whatsappLink } = response.data;
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post",
          url: directLink,
        });
      } else {
        const shareChoice = window.confirm(
          "Share via WhatsApp? OK for WhatsApp, Cancel to copy link"
        );
        shareChoice
          ? window.open(whatsappLink, "_blank")
          : navigator.clipboard.writeText(directLink).then(() =>
              alert("Link copied!")
            );
      }
    } catch (error) {
      console.error("Sharing failed:", error);
      alert("Failed to share post");
    }
  };

  /* Artificial Delay */
  const delay = () => {
    new Promise((resolve) => setTimeout(resolve, 10000));
  };

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto space-y-4">
      {/* Post creation */}
      {/* <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="bg-gray-300 dark:bg-gray-700 animate-pulse rounded-full transition-all duration-700 w-10 h-10"></div>
            ) : (
              <NextImage
                src={
                  profile?.profilePicture ||
                  "https://media.discordapp.net/attachments/1315342834278207540/1316064105588719707/pf2.jpg?ex=6759afb6&is=67585e36&hm=c74adb8fccdc099b5567f29ee46e26df2bacbb440f53b16aaee5618e4927fad9&=&format=webp&width=460&height=465"
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
                className="resize-none bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg text-gray-900 dark:text-gray-100"
              />
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  disabled
                >
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  onClick={handlePostSubmit}
                  disabled={fetchingUser || isPosting}
                >
                  {isPosting
                    ? "Posting..."
                    : fetchingUser
                    ? "Loading..."
                    : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Preloader for a single post */}
      {/* {isPosting && (
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
      )} */}

      {/* Initial Preloader */}
      {loading && <PostsPreloader />}

      {/* Error message */}
      {error && (
        <p className="text-red-500">Error loading posts: {error.message}</p>
      )}

      {/* Posts */}
      {posts.map((post, index) => {
        const uniqueKey = post.id ? `${post.id}-${index}` : index;
        return (
          <Card
            className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
            key={uniqueKey}
            ref={index === posts.length - 1 ? lastPostRef : null}
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
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  width: "48px",
                  height: "48px",
                }}
              />
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {post.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {timeAgo(post.createdAt)}
                </p>
              </div>
            </CardHeader>

            <CardContent
              className="px-4 py-2 lg:px-5 lg:pb-5 w-full"
              onClick={() => router.push(`/post/${post.id}`)}
            >
              <p className="text-gray-700 dark:text-gray-300 break-words">
                {post.content}
              </p>
            </CardContent>
            <CardFooter className="border-t border-gray-200 dark:border-gray-700 p-2">
              <div className="flex justify-between w-full">
                {/* Like Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(post.id);
                  }}
                  disabled={likeLoadingStates[post.id]}
                >
                  {likeLoadingStates[post.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp
                      className={`h-4 w-4 ${post.isLiked ? "text-blue-600" : ""}`}
                    />
                  )}
                  <span className="ml-2">{post.likeCount}</span>
                </Button>

                {/* Comments Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  <MessageCircleMore className="h-4 w-4" />
                  <div className="hidden md:block">Comments</div>
                </Button>

                {/* Share Button */}
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

                {/* Bookmark Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(post.id);
                  }}
                  disabled={bookmarkLoadingStates[post.id]}
                >
                  {bookmarkLoadingStates[post.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : post.isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  <div className="hidden md:block">Bookmark</div>
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}

      {loading && hasMore && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600 dark:border-gray-300"></div>
        </div>
      )}

{!loading &&
        (posts.length === 0 ? (
          <p className="flex justify-center align-center ">
            No bookmarks to show.
          </p>
        ) : (
          !hasMore && (
            <p className="flex justify-center align-center ">
              No more posts to load.
            </p>
          )
        ))}
    </div>
  );
}
