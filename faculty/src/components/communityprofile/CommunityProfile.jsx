"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import Image from "next/image";
import axios from "axios";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Github,
  Linkedin,
  Twitter,
  Briefcase,
  BookOpen,
  Mail,
  Globe,
  Send,
  Loader2,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/configs/index";

export default function CommunityProfile({ profileId }) {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const isOwnProfile = user?.id === profileId;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/api/profile/${profileId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      setProfile(response.data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async () => {
    if (!user || !profileId) return;
    
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/connections/status/${profileId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      setConnectionStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching connection status:", error);
      setConnectionStatus("none");
    }
  };

  useEffect(() => {
    if (accessToken && profileId) {
      fetchProfile();
      fetchConnectionStatus();
    }
  }, [accessToken, profileId]);

  const handleConnect = async () => {
    if (!profile || !profile.email || 
        !(connectionStatus === "none" || connectionStatus === "rejected")) return;
    
    setIsLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/connections/send`,
        { targetEmail: profile.email },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      
      setConnectionStatus("pending");
    } catch (error) {
      console.error("Error sending connection request:", error);
      
      if (error.response?.status === 400 && 
          error.response?.data?.message === "Connection request already sent!") {
        setConnectionStatus("pending");
      } else {
        setError("Failed to send connection request");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!profile || !profile.email || connectionStatus !== "connected") return;
    
    setIsLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/connections/remove`,
        { targetEmail: profile.email },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      
      // Update both status and connection count
      setConnectionStatus("none");
      setProfile(prev => ({
        ...prev,
        connectionsCount: prev.connectionsCount > 0 ? prev.connectionsCount - 1 : 0
      }));
    } catch (error) {
      console.error("Error removing connection:", error);
      setError("Failed to remove connection");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSocialLink = (href, IconComponent, label) => {
    if (!href) return null;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {label}
        </span>
      </a>
    );
  };

  const renderConnectButton = () => {
    if (isOwnProfile) return null;

    switch(connectionStatus) {
      case "none":
      case "rejected":
        return (
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Connect</span>
          </Button>
        );
      case "pending":
        return (
          <Button
            disabled
            className="bg-gray-600 dark:bg-gray-500 text-white flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Request Sent</span>
          </Button>
        );
      case "connected":
        return (
          <Button
            onClick={handleRemoveConnection}
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
            <span>Remove Connection</span>
          </Button>
        );
      default:
        return (
          <Button disabled className="bg-gray-600 dark:bg-gray-500 text-white flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading status...</span>
          </Button>
        );
    }
  };

  const renderBioCard = () => (
    <Card className="bg-white dark:bg-gray-800 overflow-hidden">
      {/* Banner Section */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800">
        {profile?.bannerPhoto ? (
          <Image
            src={profile.bannerPhoto}
            alt="Profile banner"
            fill
            className="object-cover"
          />
        ) : (
          <Image
            src="/banner.png"
            alt="Profile banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      <CardContent className="p-6 relative">
        {/* Profile Image - Overlapping Banner */}
        <div className="absolute -top-16 left-6">
          <div className="relative h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800">
            <Image
              src={profile?.profilePicture || "/placeholder.svg"}
              alt={profile?.name || "User profile"}
              fill
              className="rounded-full object-cover"
            />
          </div>
        </div>

        <div className="absolute top-6 right-6">
          {renderConnectButton()}
        </div> 

        <div className="pt-20">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profile?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {profile?.headline || "Member at ITER Social Connect"}
              </p>
              
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Globe className="h-4 w-4" />
                <span>{profile?.location || "Bhubaneswar, India"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-3 py-1 rounded-md">
              <Users className="h-4 w-4 text-blue-600 dark:text-white" />
              <span className="text-blue-600 dark:text-white font-medium">
                {profile?.connectionsCount || 0} Connections
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {profile?.about && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium">
                    <BookOpen className="h-5 w-5" />
                    <h3>About</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm pl-7">
                    {profile.about}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium">
                  <Mail className="h-5 w-5" />
                  <h3>Contact</h3>
                </div>
                <div className="pl-7 space-y-2">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {profile?.email}
                  </p>
                  {profile?.phone && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {profile.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium">
                  <Briefcase className="h-5 w-5" />
                  <h3>Role</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm pl-7 capitalize">
                  {profile?.role || "community member"}
                </p>
              </div>

              {/* Social Links Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium">
                  <Globe className="h-5 w-5" />
                  <h3>Social Profiles</h3>
                </div>
                <div className="pl-7 flex flex-wrap gap-2">
                  {renderSocialLink(profile?.github, Github, "GitHub")}
                  {renderSocialLink(profile?.linkedin, Linkedin, "LinkedIn")}
                  {renderSocialLink(profile?.x, Twitter, "Twitter")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const buttons = [
    {
      label: "Community Profile",
      icon: Users,
      onClick: () => {},
      active: true,
      showChevron: false,
      key: "community-profile",
    },
  ];

  let content;
  if (loading || connectionStatus === null) {
    content = <PanelsPreloader />;
  } else if (error) {
    content = (
      <p className="text-center text-red-500 py-8">
        Failed to load profile data: {error}
      </p>
    );
  } else if (!profile) {
    content = (
      <p className="text-center text-red-500 py-8">
        Profile not found
      </p>
    );
  } else {
    content = renderBioCard();
  }

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <LeftPanel
          heading="Community Profile"
          subheading="View user information"
          buttons={buttons}
        />

        <div className="flex-1">
          <RightTopPanel
            placeholder="Search profile..."
            buttonLabel="Back to Feed"
            onButtonClick={() => router.push('/explore')}
          />  
          
          <div className="space-y-4">{content}</div>
        </div>
      </div>
    </div>
  );
}