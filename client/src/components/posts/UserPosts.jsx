"use client";
/**

 * 4. Infinite Scroll
 */

/** Imports */

import { useEffect, useState, useRef, useCallback } from "react";
import NextImage from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import PostsPreloader from "@/components/preloaders/PostsPreloader";
import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
import { Image, MessageCircleMore, Forward, ThumbsUp, Bookmark, BookmarkCheck, Loader2, MoreVertical, Trash2 } from "lucide-react";
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

export default function UserPosts() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDocId, setLastDocId] = useState(null);
  const [page, setPage] = useState(1);
  // const [newPostContent, setNewPostContent] = useState("");
  // const [isPosting, setIsPosting] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [likeLoadingState, setLikeLoadingState] = useState({});
  const [likeError, setLikeError] = useState(null);
  const [bookmarkLoadingState, setBookmarkLoadingState] = useState({});
  const [bookmarkError, setBookmarkError] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const { accessToken } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const observer = useRef();

  useEffect(() => {
    if(!accessToken){
      router.push("/signin")
    }
  })

  useEffect(() => {
    if (profile) {
      setFetchingUser(false);
    }
  }, [profile]);

  const deletePost = async (postId) => {
    
    setDeletingPostId(postId);
    try {
      await axios.delete(`${BACKEND_URL}/api/user/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingPostId(null);
    }
  };

const toggleMenu = (postId, e) => {
  e.stopPropagation();
  setOpenMenuId(openMenuId === postId ? null : postId);
};

useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest('.dropdown-container')) {
      setOpenMenuId(null);
    }
  };
  
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);


  /* Fetch The User Feed (No Auth) */
  const fetchPosts = useCallback(async () => {
    if (!hasMore) return;
  
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/posts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { 
          limit: 10,
          lastDocId: lastDocId
        }
      });
  
      const newPosts = response.data.posts || [];
      const currentUserId = profile?.userId;
      
      // Process posts with like status...
      const processedPosts = newPosts.map(post => ({
        ...post,
        isLiked: currentUserId ? (post.likes || []).includes(currentUserId) : false,
        likeCount: Array.isArray(post.likes) ? post.likes.length : post.likeCount || 0
      }));
  
      setPosts(prev => [...prev, ...processedPosts]);
      setHasMore(response.data.hasMore);
      setLastDocId(response.data.lastDocId);
    } catch (err) {
      if (err.response?.data?.error === "Index missing") {
        window.open(err.response.data.solution, "_blank");
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, profile, lastDocId, hasMore]);

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

  /* Function to Fetch posts */
  useEffect(() => {
    fetchPosts();
  }, []);

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
  //     likes: 0,
  //     createdAt: new Date().toISOString(),
  //   };

  //   setNewPostContent("");

  //   try {
  //     const response = await axios.post(
  //       `${BACKEND_URL}/api/user/post`,
  //       { profilePicture: profile.profilePicture, content: newPostContent },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
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

    /* Like Service with Optimistic Update */
    const toggleLike = async (postId) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const newCount = post.isLiked
              ? post.likeCount - 1
              : post.likeCount + 1;
            return { ...post, isLiked: !post.isLiked, likeCount: newCount };
          }
          return post;
        })
      );
      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/user/posts/like`,
          { postId },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );
        const serverCount = response.data.totalLikes;
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likeCount: serverCount } : post
          )
        );
      } catch (error) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !post.isLiked,
                  likeCount: post.isLiked
                    ? post.likeCount - 1
                    : post.likeCount + 1,
                }
              : post
          )
        );
        setLikeError(
          error.response?.data?.message || "Failed to like/unlike the post"
        );
      } finally {
        setLikeLoadingState((prev) => ({ ...prev, [postId]: false }));
      }
    };
  
    /* Bookmark Service */
    const toggleBookmark = async (postId) => {
      if (!accessToken) return;
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
      )}  */}

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
            <CardHeader className="flex justify-between items-start flex-row p-4 lg:px-5 lg:pt-4">
  <div 
    className="flex items-center gap-4 flex-1 cursor-pointer"
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
        {post.userName}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {timeAgo(post.createdAt)}
      </p>
    </div>
  </div>

  {/* Delete post dropdown */}
   {/* Delete post dropdown */}
   {profile?.userId === post.userId && (
    <div className="relative dropdown-container">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={(e) => toggleMenu(post.id, e)}
        disabled={deletingPostId === post.id}
      >
        {deletingPostId === post.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </Button>
      
      {/* Dropdown menu - shown only when openMenuId matches */}
      {openMenuId === post.id && (
        <div 
          className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
        >
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                deletePost(post.id);
                setOpenMenuId(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post
            </button>
          </div>
        </div>
      )}
    </div>
  )}
</CardHeader>

            <CardContent className="px-4 py-2 lg:px-5 lg:pb-5 w-full" onClick={() => router.push(`/post/${post.id}`)}>
              <p className="text-gray-700 dark:text-gray-300 break-words">
                {post.content}
              </p>
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
