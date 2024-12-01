import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Image, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import NextImage from "next/image";

export default function MainFeed() {
  return (
    <div className="flex-1 w-full max-w-2xl mx-auto space-y-4">
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <NextImage
              src="/placeholder.svg"
              alt="Avatar"
              width={40}
              height={40}
              className="rounded-full"
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

      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex-row items-center gap-4 p-4">
          <NextImage
            src="/placeholder.svg"
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Jane Smith
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 hours ago
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <p className="text-gray-700 dark:text-gray-300">
            Looking for a React developer to join our startup! We're building an
            exciting new platform that aims to revolutionize the way people
            connect and collaborate online. If you're passionate about creating
            intuitive user interfaces and have experience with modern React
            practices, we'd love to hear from you!
          </p>
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
    </div>
  );
}
