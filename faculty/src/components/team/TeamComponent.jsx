"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import NextImage from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, User, Github, Linkedin, Twitter } from "lucide-react";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";

// Team member data
const teamMembers = [
  {
    name: "Satyam Kumar",
    position: "Backend Developer",
    imageUrl:
      "https://cdlsaecoineiohkdextf.supabase.co/storage/v1/object/public/uploads//satyam.jpg",
    github: "https://github.com/mic-720",
    linkedin: "https://www.linkedin.com/in/satyamkumar1018/",
  },
  {
    name: "Om Shankar Deshmukh",
    position: "Backend Developer",
    imageUrl: "https://media.licdn.com/dms/image/v2/D4D03AQHIINcRdr0-7A/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1677215858114?e=1756944000&v=beta&t=aGqMG48OjCHYvArGpZGP4yB2cGP3GGTxwUyYsFrsQ7Y",
    github: "https://github.com/OmShankarDeshmukh01",
    linkedin: "https://www.linkedin.com/in/om-shankar-deshmukh-7431b9245/",
  },
  {
    name: "Shaurya Jha",
    position: "Product Manager & Frontend Developer",
    imageUrl: "https://cdlsaecoineiohkdextf.supabase.co/storage/v1/object/public/uploads//pf1_d4xi6o.jpg",
    linkedin: "https://www.linkedin.com/in/shaurya--jha",
    twitter: "https://twitter.com/_shaurya35",
    github: "https://github.com/shaurya35/"
  },
  {
    name: "Swayam Sahoo",
    position: "Outreach Team",
    imageUrl: "https://cdlsaecoineiohkdextf.supabase.co/storage/v1/object/public/uploads//portfolio2.jpeg",
    github: "https://github.com/PseudoSwayam",
    linkedin: "https://www.linkedin.com/in/swayamsahoo11/"
  },
  {
    name: "Stuti Mishra",
    position: "Outreach Team",
    imageUrl: "https://cdlsaecoineiohkdextf.supabase.co/storage/v1/object/public/uploads//photo3.jpg",
    github: "https://github.com/STUTI-MISHRA-8",
    linkedin: "https://www.linkedin.com/in/stuti86",
  },
  {
    name: "Anubhav Jaiswal",
    position: "Strategic Partner",
    imageUrl: "https://cdlsaecoineiohkdextf.supabase.co/storage/v1/object/public/uploads//img2.jpg",
    github: "http://github.com/anubhav-auth",
    linkedin: "http://linkedin.com/in/anubhav-auth/",
    twitter: "https://x.com/anubhavauth",
  },
];

// Social Button
function SocialButton({ href, Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
      aria-label={label}
    >
      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    </a>
  );
}

export default function TeamComponent() {
  const { accessToken } = useAuth();
  const router = useRouter();

  if (!accessToken) {
    router.push("/signin");
    return null;
  }

  const buttons = [
    { label: "Our Team", icons: Settings, showChevron: true, key: "team" },
  ];

  return (
    <div className="max-w-7xl mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-8">
        <LeftPanel
          heading="Our Team"
          subheading="Meet the creators"
          buttons={buttons}
        />

        <div className="flex-1">
          <RightTopPanel
            placeholder="Search team members..."
            buttonLabel="Contact Team"
            buttonIcon={User}
            onButtonClick={() => alert("Contact itersocialconnect@gmail.com")}
          />

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col items-center text-center shadow hover:shadow-lg transition"
              >
                <div className="relative w-28 h-28 rounded-full overflow-hidden mb-4">
                  <NextImage
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {member.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {member.position}
                </span>

                <div className="flex space-x-2">
                  {member.github && (
                    <SocialButton
                      href={member.github}
                      Icon={Github}
                      label="GitHub"
                    />
                  )}
                  {member.linkedin && (
                    <SocialButton
                      href={member.linkedin}
                      Icon={Linkedin}
                      label="LinkedIn"
                    />
                  )}
                  {member.twitter && (
                    <SocialButton
                      href={member.twitter}
                      Icon={Twitter}
                      label="Twitter"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
