import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthProvider";
import { FirebaseMessagingProvider } from "@/contexts/FirebaseMessagingProvider";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Navbar from "@/components/home/navbar/Navbar";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "Home / ITER Connect",
  description: "Connect, Collaborate, and Grow",
  manifest: '/manifest.json', 
  themeColor: '#000000', 
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="!scroll-smooth">
      <body
        className={`${poppins.className} ${geistMono.variable} ${geistSans.variable} min-h-screen antialiased overflow-x-hidden`}
      >
        <ThemeProvider>
          <AuthProvider>
            <FirebaseMessagingProvider>
              <ProfileProvider>
                <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                  <Navbar />
                  {children}
                  <Analytics />
                  <SpeedInsights />
                </div>
              </ProfileProvider>
            </FirebaseMessagingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
