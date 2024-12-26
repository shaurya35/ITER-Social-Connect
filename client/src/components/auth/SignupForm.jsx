"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regNo, setRegNo] = useState("");
  const [idCard, setIdCard] = useState(null);
  const [discordUrl, setDiscordUrl] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("signup");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Handle photo upload
  const uploadPhoto = async (file) => {
    setIsUploading(true);
    setUploadComplete(false);
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload the photo.");
      }

      const { imageUrl } = await response.json();
      setDiscordUrl(imageUrl);
      setUploadComplete(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleIdCardChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    setIdCard(file);
    if (file) uploadPhoto(file);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isUploading && idCard) {
        await uploadPhoto(idCard);
      }

      if (!uploadComplete) {
        throw new Error("Failed to complete the upload. Please try again.");
      }

      const response = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, regNo, discordUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to sign up. Please try again.");
      }

      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error("Invalid OTP. Please try again.");
      }

      setStep("complete");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Signup Form */}
      {step === "signup" && (
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Email address
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

          {/* Registration Number */}
          <div>
            <Label htmlFor="regNo" className="text-gray-700 dark:text-gray-300">
              Registration Number
            </Label>
            <Input
              id="regNo"
              type="text"
              required
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>

          {/* ID Card Photo */}
          <div>
            <Label
              htmlFor="idCard"
              className="text-gray-700 dark:text-gray-300"
            >
              Upload ID Card
            </Label>
            <div className="relative">
              <Input
                id="idCard"
                type="file"
                accept="image/*"
                required
                onChange={handleIdCardChange}
                disabled={isUploading && !error}
                className={`mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {isUploading && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  
                </div>
              )}
            </div>
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
              disabled={isUploading || isLoading}
            >
              {isUploading
                ? "Please wait for upload to finish..."
                : isLoading
                ? "Processing..."
                : "Sign up"}
            </Button>
          </div>
        </form>
      )}

      {/* OTP Verification */}
      {step === "verify" && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
              Enter OTP
            </Label>
            <Input
              id="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
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

          <div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Verifying OTP..." : "Verify OTP"}
            </Button>
          </div>
        </form>
      )}

      {/* Completion Message */}
      {step === "complete" && (
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Thank you for registering!
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your profile awaits admin approval. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
}
