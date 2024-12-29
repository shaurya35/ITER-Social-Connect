"use client";
import NextImage from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const timeAgo = (dateString) => {
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

export default function MainFeed() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [username, setUsername] = useState("");
  const [fetchingUser, setFetchingUser] = useState(true);
  const { accessToken, user } = useAuth();

  const observer = useRef();

  useEffect(() => {
    setIsHydrated(true);

    if (user && accessToken) {
      setFetchingUser(true);
      axios
        .get("http://localhost:8080/api/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const { name } = response.data;
          setUsername(name || "Explorer");
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
        })
        .finally(() => {
          setFetchingUser(false);
        });
    }else{
      setFetchingUser(false);
    }
  }, [user, accessToken]);

  const fetchPosts = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      // await new Promise(resolve => setTimeout(resolve, 10000));
      const response = await axios.get(`http://localhost:8080/api/feed`, {
        params: { page, limit: 10 },
        withCredentials: true,
      });
      const newPosts = response.data.posts || [];
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setHasMore(newPosts.length > 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore]);

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

  const handlePostSubmit = async () => {
    if (!newPostContent.trim()) return; 

    const tempPost = {
      id: "temp",
      userName: username, 
      content: newPostContent,
      createdAt: new Date().toISOString(),
    };

    setPosts((prevPosts) => [tempPost, ...prevPosts]);
    setNewPostContent("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/user/post",
        { content: newPostContent },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      const { postId } = response.data;

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === "temp" ? { ...post, id: postId } : post
        )
      );
    } catch (err) {
      console.error("Error creating new post:", err);
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== "temp"));
      alert("Failed to post. Please try again.");
    }
  };

  useEffect(() => {
    if (isHydrated) {
      fetchPosts();
    }
  }, [fetchPosts, isHydrated]);

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto space-y-4">
      {/* Post creation */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <NextImage
              src="https://media.discordapp.net/attachments/1315342834278207540/1316064105588719707/pf2.jpg?ex=6759afb6&is=67585e36&hm=c74adb8fccdc099b5567f29ee46e26df2bacbb440f53b16aaee5618e4927fad9&=&format=webp&width=460&height=465"
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
                >
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  onClick={handlePostSubmit}
                  disabled={fetchingUser} 
                >
                  {fetchingUser ? "Loading..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

     {/* Preloader */}
     {loading && (
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
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500">Error loading posts: {error.message}</p>
      )}

      {/* Posts */}
      {posts.map((post, index) => {
        const uniqueKey = post.id ? `${post.id}-${index}` : index;

        return (
          <Card
            className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
            key={uniqueKey}
            ref={index === posts.length - 1 ? lastPostRef : null}
          >
            <CardHeader className="flex-row items-center gap-4 p-4">
              <NextImage
                src="https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"
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
            </CardHeader>

            <CardContent className="px-4 py-2">
              <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
            </CardContent>
            <CardFooter className="border-t border-gray-200 dark:border-gray-700 p-2">
              <div className="flex justify-between w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Like
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}

      {!hasMore && <p>No more posts to load.</p>}
    </div>
  );
}
