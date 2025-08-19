import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthProvider";
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
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

export const metadata = {
  title: "ITER Connect - Connect, Collaborate, and Grow",
  description: "ITER Social Connect is a platform designed to help students collaborate, innovate, and grow. Find project partners, gain mentorship from experienced individuals, and build connections with like-minded peers.",
  keywords: "ITER, social connect, student collaboration, project partners, hackathon teams, mentorship, coding community, developers, college projects, innovation, networking, tech students",
  authors: [{ name: "ITER Connect Team" }],
  creator: "ITER Connect Team",
  publisher: "ITER Connect",
  manifest: '/manifest.json', 
  themeColor: '#000000',
  
  // Open Graph
  openGraph: {
    title: "ITER Connect - Connect, Collaborate, and Grow",
    description: "ITER Social Connect is a platform designed to help students collaborate, innovate, and grow. Find project partners, gain mentorship, and build connections with like-minded peers.",
    url: 'https://itersocialconnect.vercel.app',
    siteName: 'ITER Connect',
    images: [
      {
        url: 'https://itersocialconnect.vercel.app/banner.png',
        width: 1200,
        height: 630,
        alt: 'ITER Connect - Student Collaboration Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: "ITER Connect - Connect, Collaborate, and Grow",
    description: "ITER Social Connect is a platform designed to help students collaborate, innovate, and grow. Find project partners, gain mentorship, and build connections with like-minded peers.",
    images: ['https://itersocialconnect.vercel.app/banner.png'],
    creator: '@_shaurya35',
    site: '@itersocialconnect',
  },
  
  // Additional meta tags
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  canonical: 'https://itersocialconnect.vercel.app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="!scroll-smooth">
      <body
        className={`${poppins.className} ${geistMono.variable} ${geistSans.variable} min-h-screen antialiased overflow-x-hidden`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ProfileProvider>
              <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Navbar />
                {children}
                <Analytics />
                <SpeedInsights />
              </div>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
