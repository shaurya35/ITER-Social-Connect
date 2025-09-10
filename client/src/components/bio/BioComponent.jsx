"use client";
import Image from "next/image";
import { useProfile } from "@/contexts/ProfileContext";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Github,
  Linkedin,
  Twitter,
  Hash,
  Briefcase,
  BookOpen,
  Mail,
  Globe,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

export default function BioComponent() {
  const { profile, loading } = useProfile();
  const router = useRouter();
  const { isDarkMode} = useTheme();

  const src = isDarkMode ? "/placeholder-banner-dark.png": "/placeholder-banner-light.png";

  const buttons = [
    {
      label: "My Profile",
      icon: Users,
      onClick: () => {},
      active: true,
      showChevron: false,
      key: "profile",
    },
  ];

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
            src={src}
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
              src={profile?.profilePicture || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"}
              alt={profile?.name || "User profile"}
              fill
              className="rounded-full object-cover"
            />
          </div>
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
                  {profile?.role}
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

  let content;
  if (loading) {
    content = <PanelsPreloader />;
  } else if (!profile) {
    content = (
      <p className="text-center text-red-500 py-8">
        Failed to load profile data
      </p>
    );
  } else {
    content = renderBioCard();
  }

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <LeftPanel
          heading="Bio Profile"
          subheading="Your personal information"
          buttons={buttons}
        />

        <div className="flex-1">
          <RightTopPanel
            placeholder="Search bio..."
            buttonLabel="Edit Profile"
            onButtonClick={() => router.push('/settings')}
          />  
          
          <div className="space-y-4">{content}</div>
        </div>
      </div>
    </div>
  );
}
