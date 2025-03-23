"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import Image from "next/image";
import axios from "axios";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Github, Linkedin, Twitter, Hash, Briefcase, BookOpen } from "lucide-react";

export default function CommunityProfile({ profileId }) {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/${profileId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
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

    if (accessToken && profileId) {
      fetchProfile();
    }
  }, [accessToken, profileId]);

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
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      </a>
    );
  };

  const renderBioCard = () => (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image Section */}
          <div className="space-y-4">
            <div className="relative h-32 w-32 rounded-full border-2 border-gray-200 dark:border-gray-600">
              <Image
                src={profile?.profilePicture || "/placeholder.svg"}
                alt={profile?.name || "User profile"}
                fill
                className="rounded-full object-cover"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md">
              <Users className="h-4 w-4" />
              <span>{profile?.connectionsCount || 0} Connections</span>
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {profile?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">{profile?.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Registration No.</p>
                  <p className="text-gray-700 dark:text-gray-200">{profile?.regNo}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-gray-700 dark:text-gray-200 capitalize">{profile?.role}</p>
                </div>
              </div>
            </div>

            {profile?.about && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <BookOpen className="h-5 w-5" />
                  <h3 className="font-medium">About</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{profile.about}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {renderSocialLink(profile?.github, Github, "GitHub")}
              {renderSocialLink(profile?.linkedin, Linkedin, "LinkedIn")}
              {renderSocialLink(profile?.x, Twitter, "Twitter")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const buttons = [
    {
      label: "Profile Overview",
      icon: Users,
      onClick: () => {},
      active: true,
      showChevron: false,
      key: "overview",
    }
  ];

  let content;
  if (loading) {
    content = <PanelsPreloader />;
  } else if (error) {
    content = (
      <p className="text-center text-red-500 py-8">
        {error}
      </p>
    );
  } else {
    content = renderBioCard();
  }

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <LeftPanel
          heading="Member Profile"
          subheading="Community member details"
          buttons={buttons}
        />

        <div className="flex-1">
          <RightTopPanel
            placeholder="Search profile..."
            buttonLabel="Edit Profile"
            onButtonClick={() => ({})}
            disabled={true}
          />

          <div className="space-y-4">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}