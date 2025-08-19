import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/*?*utm_*',  // Disallow crawling UTM parameter URLs
          '/signup',    // Optional: prevent indexing of signup pages
          '/signin',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
        ],
      }
    ],
    sitemap: 'https://itersocialconnect.vercel.app/sitemap.xml',
    host: 'https://itersocialconnect.vercel.app'
  }
}