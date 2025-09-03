"use client";

/**
 * Todo 1: Disable button while uploading
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Select from "react-select";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthProvider";
import { BACKEND_URL, BOT_URL } from "@/configs/index";

const interestOptions = [
  { value: "sih", label: "SIH" },
  { value: "aiml", label: "AI/ML" },
  { value: "webdev", label: "Web Development" },
  { value: "mobile", label: "Mobile Development" },
  { value: "cloud", label: "Cloud Computing" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "datascience", label: "Data Science" },
  { value: "devops", label: "DevOps" },
  { value: "blockchain", label: "Blockchain" },
];

export default function CompleteProfile() {
  const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("")
  const password = sessionStorage.getItem("pendingPassword");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [x, setX] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [fieldsOfInterest, setFieldsOfInterest] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // If the user is already logged in, redirect them to the explore page
    if (user) {
      router.push("/explore");
    }

    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [user, router, searchParams]);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDarkMode ? "#374151" : "#ffffff",
      borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
      color: isDarkMode ? "#e5e7eb" : "#111827",
      boxShadow: state.isFocused
        ? isDarkMode
          ? "0 0 0 1px #9ca3af"
          : "0 0 0 1px #6b7280"
        : null,
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
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#2d3748" : "#e2e8f0",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDarkMode ? "#e5e7eb" : "#111827",
      cursor: "pointer",
      ":hover": {
        backgroundColor: isDarkMode ? "#4a5568" : "#cbd5e0",
        color: isDarkMode ? "#ffffff" : "#000000",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
    placeholder: (base) => ({
      ...base,
      color: isDarkMode ? "#e5e7eb" : "#111827",
    }),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Send the profile data to the backend
      // const response = await axios.post(
      //   `${BACKEND_URL}/api/auth/complete-profile`,
      //   {
      //     email,
      //     password,
      //     name,
      //     about,
      //     github,
      //     linkedin,
      //     x,
      //     profilePicture: profilePictureUrl, // Use the uploaded URL
      //     fieldsOfInterest: fieldsOfInterest.map((option) => option.value), // Convert back to values
      //   },
      //   { withCredentials: true }
      // );

      const payload = {
        email,
        password,
        name,
        about,
        ...(github && { github }),
        ...(linkedin && { linkedin }),
        ...(x && { x }),
        ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
        ...(fieldsOfInterest.length > 0 && {
          fieldsOfInterest: fieldsOfInterest.map((option) => option.value),
        }),
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/auth/complete-profile`,
        payload,
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { accessToken, user } = response.data;
        sessionStorage.removeItem("pendingPassword");

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

  const uploadPhoto = async (file) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`${BOT_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload the photo.");
      }

      const { imageUrl } = await response.json();
      setProfilePictureUrl(imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    setProfilePicture(file);
    if (file) uploadPhoto(file);
  };

  console.log({
    email,
    password,
    name,
    about,
    github,
    linkedin,
    x,
    profilePicture: profilePictureUrl,
    fieldsOfInterest: fieldsOfInterest.map((option) => option.value),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
        Complete Your Profile
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <Label className="text-gray-700 dark:text-gray-300">Email</Label>
          <Input
            value={email}
            readOnly={!!searchParams.get("email")}
            onChange={(e) =>
              !searchParams.get("email") && setEmail(e.target.value)
            }
            className={`mt-1 ${
              searchParams.get("email")
                ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                : "bg-white dark:bg-gray-700"
            } text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700`}
          />
        </div>

        {/* Password */}
        {/* <div>
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
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
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div> */}

        {/* Name */}
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

        {/* About */}
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

        {/* GitHub URL */}
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

        {/* Fields of interests */}
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

        {/* Profile Photo */}
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
    </div>
  );
}
