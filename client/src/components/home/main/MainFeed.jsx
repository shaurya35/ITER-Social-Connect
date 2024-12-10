"use client";
import NextImage from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, MessageCircle, Share2, ThumbsUp } from "lucide-react";
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

  const observer = useRef();

  const fetchPosts = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/api/feed`, {
        params: { page, limit: 10 },
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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (error) return <p>Error: {error.message}</p>;

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
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/*posts */}
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
                src="https://media.discordapp.net/attachments/1315342834278207540/1316064150744465488/pf3.jpg?ex=6759afc0&is=67585e40&hm=23ad30767f15d0db1c126fefe50e09089995b066a4d4bb395659c74a269d27d1&=&format=webp&width=460&height=465"
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
                  {post.userId}
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

      {loading && <p>Loading more posts...</p>}
      {!hasMore && <p>No more posts to load.</p>}
    </div>
  );
}
