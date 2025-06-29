/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  images: {
    domains: ["media.discordapp.net", "res.cloudinary.com", "cdlsaecoineiohkdextf.supabase.co", "media.licdn.com"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    return config;
  },
};

export default nextConfig;