"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthProvider";

export default function CompleteProfile() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    // If the user is already logged in, redirect them to the explore page
    if (user) {
      router.push("/explore");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Send the profile data to the backend
      const response = await axios.post(
        "http://localhost:8080/api/auth/complete-profile",
        {
          email,
          password,
          name,
          about,
          github,
          linkedin,
          xUrl,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { accessToken, user } = response.data;

        // Log the user in
        login(user, accessToken);

        // Redirect to explore
        router.push("/explore");
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to complete profile. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
        Complete Your Profile
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* Password */}
        <div>
          <Label
            htmlFor="password"
            className="text-gray-700 dark:text-gray-300"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" /> 
              )}
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* About */}
        <div>
          <Label htmlFor="about" className="text-gray-700 dark:text-gray-300">
            About
          </Label>
          <Input
            id="about"
            type="text"
            required
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* GitHub URL */}
        <div>
          <Label htmlFor="github" className="text-gray-700 dark:text-gray-300">
            GitHub URL
          </Label>
          <Input
            id="github"
            type="url"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* LinkedIn URL */}
        <div>
          <Label
            htmlFor="linkedin"
            className="text-gray-700 dark:text-gray-300"
          >
            LinkedIn URL
          </Label>
          <Input
            id="linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* X URL */}
        <div>
          <Label htmlFor="xUrl" className="text-gray-700 dark:text-gray-300">
            X (Twitter) URL
          </Label>
          <Input
            id="xUrl"
            type="url"
            value={xUrl}
            onChange={(e) => setXUrl(e.target.value)}
            className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* Error Handling */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
