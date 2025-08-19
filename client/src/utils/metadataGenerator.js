/**
 * Social Media Meta Tags Generator for Dynamic Pages
 * Use this utility to generate meta tags for posts, profiles, and other dynamic content
 */

export const generateMetadata = async ({ params, searchParams }) => {
  const baseUrl = 'https://itersocialconnect.vercel.app';
  
  // Default metadata
  const defaultMeta = {
    title: 'ITER Connect - Connect, Collaborate, and Grow',
    description: 'ITER Social Connect is a platform designed to help students collaborate, innovate, and grow. Find project partners, gain mentorship, and build connections with like-minded peers.',
    image: `${baseUrl}/banner.png`,
    url: baseUrl,
  };

  return {
    title: defaultMeta.title,
    description: defaultMeta.description,
    keywords: 'ITER, social connect, student collaboration, project partners, hackathon teams, mentorship, coding community',
    authors: [{ name: 'ITER Connect Team' }],
    
    openGraph: {
      title: defaultMeta.title,
      description: defaultMeta.description,
      url: defaultMeta.url,
      siteName: 'ITER Connect',
      images: [
        {
          url: defaultMeta.image,
          width: 1200,
          height: 630,
          alt: defaultMeta.title,
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title: defaultMeta.title,
      description: defaultMeta.description,
      images: [defaultMeta.image],
      creator: '@_shaurya35',
      site: '@itersocialconnect',
    },
    
    alternates: {
      canonical: defaultMeta.url,
    },
    
    robots: {
      index: true,
      follow: true,
    }
  };
};

// Post-specific metadata generator
export const generatePostMetadata = async (postId) => {
  const baseUrl = 'https://itersocialconnect.vercel.app';
  
  try {
    // In a real implementation, you would fetch the post data here
    // const post = await fetchPost(postId);
    
    // Mock data for now - replace with actual API call
    const post = {
      id: postId,
      content: 'Check out this amazing post on ITER Connect!',
      authorName: 'Student Developer',
      createdAt: new Date().toISOString(),
      image: `${baseUrl}/banner.png`
    };
    
    const title = `${post.authorName} on ITER Connect`;
    const description = post.content.length > 160 
      ? post.content.substring(0, 157) + '...'
      : post.content;
    const url = `${baseUrl}/post/${postId}`;
    
    return {
      title,
      description,
      authors: [{ name: post.authorName }],
      
      openGraph: {
        title,
        description,
        url,
        siteName: 'ITER Connect',
        images: [
          {
            url: post.image || `${baseUrl}/banner.png`,
            width: 1200,
            height: 630,
            alt: title,
          }
        ],
        locale: 'en_US',
        type: 'article',
        publishedTime: post.createdAt,
      },
      
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [post.image || `${baseUrl}/banner.png`],
        creator: '@_shaurya35',
        site: '@itersocialconnect',
      },
      
      alternates: {
        canonical: url,
      }
    };
  } catch (error) {
    console.error('Error generating post metadata:', error);
    return generateMetadata({});
  }
};

// Profile-specific metadata generator
export const generateProfileMetadata = async (userId) => {
  const baseUrl = 'https://itersocialconnect.vercel.app';
  
  try {
    // In a real implementation, you would fetch the user data here
    // const user = await fetchUser(userId);
    
    // Mock data for now - replace with actual API call
    const user = {
      id: userId,
      name: 'ITER Student',
      about: 'Passionate developer and student at ITER, looking to collaborate on exciting projects.',
      profilePicture: `${baseUrl}/banner.png`
    };
    
    const title = `${user.name} - ITER Connect Profile`;
    const description = user.about || `Connect with ${user.name} on ITER Connect. Discover their projects and collaborate on innovative ideas.`;
    const url = `${baseUrl}/profile/${userId}`;
    
    return {
      title,
      description,
      authors: [{ name: user.name }],
      
      openGraph: {
        title,
        description,
        url,
        siteName: 'ITER Connect',
        images: [
          {
            url: user.profilePicture || `${baseUrl}/banner.png`,
            width: 1200,
            height: 630,
            alt: title,
          }
        ],
        locale: 'en_US',
        type: 'profile',
      },
      
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [user.profilePicture || `${baseUrl}/banner.png`],
        creator: '@_shaurya35',
        site: '@itersocialconnect',
      },
      
      alternates: {
        canonical: url,
      }
    };
  } catch (error) {
    console.error('Error generating profile metadata:', error);
    return generateMetadata({});
  }
};