"use client";

import Head from 'next/head';

/**
 * Comprehensive SEO component for social media optimization
 * Supports Open Graph, Twitter Cards, and structured data
 */
export default function SEOHead({
  title = "ITER Connect - Connect, Collaborate, and Grow",
  description = "ITER Social Connect is a platform designed to help students collaborate, innovate, and grow. Find project partners, gain mentorship, and build connections with like-minded peers.",
  url = "https://itersocialconnect.vercel.app",
  image = "https://itersocialconnect.vercel.app/banner.png",
  type = "website",
  author = "ITER Connect Team",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  canonical,
  noindex = false,
  structuredData
}) {
  // Ensure absolute URL for image
  const absoluteImage = image?.startsWith('http') ? image : `${url}${image}`;
  const absoluteUrl = url?.startsWith('http') ? url : `https://itersocialconnect.vercel.app${url}`;
  const canonicalUrl = canonical || absoluteUrl;

  // Generate keywords from tags and default keywords
  const defaultKeywords = [
    "ITER", "social connect", "student collaboration", "project partners", 
    "hackathon teams", "mentorship", "coding community", "developers", 
    "college projects", "innovation", "networking", "tech students"
  ];
  const allKeywords = [...defaultKeywords, ...tags].join(", ");

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="ITER Connect" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article-specific Open Graph tags */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {type === "article" && tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content="@itersocialconnect" />
      <meta name="twitter:creator" content="@_shaurya35" />
      
      {/* Additional Social Media Meta Tags */}
      <meta property="fb:app_id" content="your-facebook-app-id" />
      
      {/* Mobile App Meta Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="ITER Connect" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://cdlsaecoineiohkdextf.supabase.co" />
      <link rel="preconnect" href="https://res.cloudinary.com" />
      <link rel="preconnect" href="https://media.licdn.com" />
      
      {/* DNS Prefetch for social media domains */}
      <link rel="dns-prefetch" href="//facebook.com" />
      <link rel="dns-prefetch" href="//twitter.com" />
      <link rel="dns-prefetch" href="//linkedin.com" />
    </Head>
  );
}

/**
 * Generate structured data for different content types
 */
export const generateStructuredData = {
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ITER Connect",
    "description": "A platform for students to collaborate, innovate, and grow together",
    "url": "https://itersocialconnect.vercel.app",
    "logo": "https://itersocialconnect.vercel.app/android-512x512.png",
    "sameAs": [
      "https://github.com/shaurya35/ITER-Social-Connect",
      "https://linkedin.com/company/iter-connect"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://itersocialconnect.vercel.app/team"
    }
  }),
  
  article: (post) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title || post.content?.substring(0, 60),
    "description": post.content?.substring(0, 160),
    "author": {
      "@type": "Person",
      "name": post.authorName,
      "url": `https://itersocialconnect.vercel.app/profile/${post.userId}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "ITER Connect",
      "logo": {
        "@type": "ImageObject",
        "url": "https://itersocialconnect.vercel.app/android-512x512.png"
      }
    },
    "datePublished": post.createdAt,
    "dateModified": post.updatedAt || post.createdAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://itersocialconnect.vercel.app/post/${post.id}`
    },
    "image": post.image || "https://itersocialconnect.vercel.app/banner.png"
  }),
  
  person: (user) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": user.name,
    "description": user.about || `${user.name} is a member of ITER Connect community`,
    "url": `https://itersocialconnect.vercel.app/profile/${user.id}`,
    "image": user.profilePicture,
    "alumniOf": {
      "@type": "Organization",
      "name": "Institute of Technical Education and Research (ITER)"
    },
    "sameAs": [
      user.linkedin,
      user.github,
      user.twitter
    ].filter(Boolean)
  })
};