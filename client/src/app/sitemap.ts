import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://itersocialconnect.vercel.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    }
  ]

  // You can add dynamic pages here by fetching from your API
  // For example, recent posts, user profiles, etc.
  // const dynamicPages = await fetchRecentPosts().then(posts => 
  //   posts.map(post => ({
  //     url: `${baseUrl}/post/${post.id}`,
  //     lastModified: new Date(post.updatedAt),
  //     changeFrequency: 'weekly' as const,
  //     priority: 0.6,
  //   }))
  // )

  return [
    ...staticPages,
    // ...dynamicPages
  ]
}