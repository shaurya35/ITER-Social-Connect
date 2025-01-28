"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import axios from "axios";
import NextImage from "next/image";
import { Image, MessageCircleMore, Forward, ThumbsUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "../ui/button";

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

export default function SinglePost({ postId }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchSinglePost = async () => {
      setLoading(true);
      try {
        // await new Promise((resolve) => setTimeout(resolve, 10000));
        const response = await axios.get(
          `http://localhost:8080/api/user/post/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          }
        );
        setPost(response.data.post);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchSinglePost();
    }
  }, [postId, accessToken]);

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (!post) {
    return <div>No post found</div>;
  }

  return (
    <>
      <Card
      className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <CardHeader className="flex-row items-center gap-4 p-4 lg:px-5 lg:pt-4">
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
      </CardHeader>

      <CardContent className="px-4 py-2 lg:px-5 lg:pb-5 w-full">
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
          >
            <ThumbsUp className="h-4 w-4" />
            {post.likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <MessageCircleMore className="h-4 w-4" />
            Comment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Forward className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
    </>
  );
}
