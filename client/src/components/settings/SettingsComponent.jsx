"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, User } from "lucide-react";
import axios from "axios";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "../preloaders/PanelsPreloader";

export default function SettingsComponent() {
  const [settings, setSettings] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const { accessToken } = useAuth();

  const buttons = [
    {
      label: "Settings",
      icons: Settings,
      showChevron: true,
      key: "settings",
    },
  ];

  useEffect(() => {
    const getSettings = async () => {
      setSettingsLoading(true);
      try {
        const response = await axios.get("http://localhost:8080/api/settings", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
        setSettings(response.data.settings);
      } catch (error) {
        setSettingsError(error.message);
      } finally {
        setSettingsLoading(false);
      }
    };

    getSettings();
  }, [accessToken]);

  /* Settings Rendering */
  const renderSettingsCard = (setting) => (
    <Card
      key={setting.id}
      className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Profile Section */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative h-12 w-12 min-w-[48px] rounded-full overflow-hidden">
              <Image
                src="/placeholder.svg"
                alt="Setting Icon"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-lg sm:text-xl">
                {setting.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {setting.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center sm:gap-2 md:gap-3 w-full sm:w-auto sm:justify-start mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shrink-0 w-full sm:w-auto"
              disabled
            >
              <span className="block md:inline-block text-sm">Modify</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <LeftPanel
          heading="Settings"
          subheading="Manage your account!"
          buttons={buttons}
        />

        {/* Main Content */}
        <div className="flex-1">
          <RightTopPanel
            placeholder="Search settings..."
            buttonLabel="Update Settings"
            buttonIcon={User}
            onButtonClick={() => console.log("Update Settings Clicked")}
            disabled={true}
          />

          {/* Render Settings with Preloader */}
          <div className="grid gap-4">
            {settingsLoading ? (
              <PanelsPreloader />
            ) : settingsError ? (
              <p className="text-red-500">Failed to load settings: {settingsError}</p>
            ) : settings.length > 0 ? (
              settings.map((setting) => renderSettingsCard(setting))
            ) : (
              <p className="text-gray-500 text-center">No settings found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}