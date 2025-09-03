"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKEND_URL, BOT_URL } from "@/configs/index";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Select from "react-select";
import { useTheme } from "@/contexts/ThemeContext";
import axios from "axios";

const interestOptions = [
  { value: "Artificial Intelligence", label: "Artificial Intelligence" },
  { value: "Machine Learning", label: "Machine Learning" },
  { value: "Data Science", label: "Data Science" },
  { value: "Web Development", label: "Web Development" },
  { value: "Mobile App Development", label: "Mobile App Development" },
  { value: "Cloud Computing", label: "Cloud Computing" },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "Blockchain", label: "Blockchain" },
  { value: "Internet of Things (IoT)", label: "Internet of Things (IoT)" },
  { value: "Software Engineering", label: "Software Engineering" },
  { value: "Database Management", label: "Database Management" },
  { value: "Networking", label: "Networking" },
  { value: "Game Development", label: "Game Development" },
  { value: "DevOps", label: "DevOps" },
  { value: "UI/UX Design", label: "UI/UX Design" },
];

const roleOptions = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "alumni", label: "Alumni" },
];

export function SignupForm() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user, login } = useAuth();

  // Step 1 states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 states
  const [otp, setOtp] = useState("");

  // Step 3 states
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [x, setX] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [fieldsOfInterest, setFieldsOfInterest] = useState([]);

  // Common states
  const [step, setStep] = useState("signup");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) router.push("/explore");
  }, [user, router]);

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#374151" : "#ffffff",
      borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
      color: isDarkMode ? "#e5e7eb" : "#111827",
      "&:hover": {
        borderColor: isDarkMode ? "#9ca3af" : "#6b7280",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isDarkMode
        ? isFocused
          ? "#374151"
          : "#1f2937"
        : isFocused
        ? "#e5e7eb"
        : "#ffffff",
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
  };

  const uploadProfilePicture = async (file) => {
    if (!file) return "";

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`${BOT_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload profile picture");

      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error("Invalid response from upload service");
      }

      return data.url;
    } catch (err) {
      setError(err.message);
      return "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePictureFile(file);
    const url = await uploadProfilePicture(file);
    if (url) {
      setProfilePictureUrl(url);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: role.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.message || "Failed to sign up. Please try again."
        );
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
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) throw new Error("Invalid OTP. Please try again.");

      setStep("complete");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Upload profile picture if a new file was selected
      let finalProfilePictureUrl = profilePictureUrl;
      if (profilePictureFile && !profilePictureUrl) {
        finalProfilePictureUrl = await uploadProfilePicture(profilePictureFile);
      }

      // Prepare request data
      const requestData = {
        email,
        password,
        name,
        about,
        ...(github && { github }),
        ...(linkedin && { linkedin }),
        ...(x && { x }),
        ...(finalProfilePictureUrl && {
          profilePicture: finalProfilePictureUrl,
        }),
        ...(fieldsOfInterest.length > 0 && {
          fieldsOfInterest: fieldsOfInterest.map((option) => option.value),
        }),
      };

      // Send request to complete profile
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/complete-profile`,
        requestData,
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { accessToken, user } = response.data;
        login(user, accessToken);
        router.push("/explore");
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (err) {
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const errorMessage = [
          err.response.data.message,
          ...err.response.data.errors,
        ].join("\n");

        setError(errorMessage);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to complete profile. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Basic Details */}
      {step === "signup" && (
        <form onSubmit={handleSignup} className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Create Account
          </h1>

          {/* Role Selection */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">Role</Label>
            <Select
              options={roleOptions}
              value={role}
              onChange={setRole}
              className="mt-1"
              classNamePrefix="select"
              styles={customStyles}
              isSearchable={false}
            />
          </div>

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
              {isLoading ? "Processing..." : "Continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {step === "verify" && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Verify Email
          </h1>

          <div>
            <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
              Enter OTP sent to {email}
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
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </div>
        </form>
      )}

      {/* Step 3: Complete Profile */}
      {step === "complete" && (
        <form onSubmit={handleCompleteProfile} className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Complete Your Profile
          </h1>

          {/* Email (read-only) */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">Email</Label>
            <Input
              value={email}
              readOnly
              className="mt-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Name (required) */}
          <div>
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
              Full Name <span className="text-red-500">*</span>
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

          {/* About (required) */}
          <div>
            <Label htmlFor="about" className="text-gray-700 dark:text-gray-300">
              About <span className="text-red-500">*</span>
            </Label>
            <Input
              id="about"
              type="text"
              required
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              placeholder="Brief introduction about yourself"
            />
          </div>

          {/* Social Links (optional) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label
                htmlFor="github"
                className="text-gray-700 dark:text-gray-300"
              >
                GitHub
              </Label>
              <Input
                id="github"
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <Label
                htmlFor="linkedin"
                className="text-gray-700 dark:text-gray-300"
              >
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <Label htmlFor="x" className="text-gray-700 dark:text-gray-300">
                X (Twitter)
              </Label>
              <Input
                id="x"
                type="url"
                value={x}
                onChange={(e) => setX(e.target.value)}
                className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                placeholder="https://x.com/username"
              />
            </div>
          </div>

          {/* Fields of Interest (optional) */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">
              Fields of Interest
            </Label>
            <Select
              isMulti
              options={interestOptions}
              value={fieldsOfInterest}
              onChange={setFieldsOfInterest}
              className="mt-1"
              classNamePrefix="select"
              styles={customStyles}
              placeholder="Select your interests (optional)"
            />
          </div>

          {/* Profile Photo (optional) */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300">
              Profile Photo
            </Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                disabled={isUploading}
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
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Optional - JPG, PNG or GIF (MAX. 5MB)
            </p>
            {/* {profilePictureUrl && (
              <p className="mt-1 text-sm text-green-500 dark:text-green-400">
                Profile picture uploaded: {profilePictureUrl}
              </p>
            )} */}
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
              disabled={isLoading || isUploading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
