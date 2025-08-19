/**
 * Enhanced social media sharing utilities with UTM tracking
 * and platform-specific optimizations
 */

// UTM parameter generator for tracking social media traffic
export const generateUTMParameters = (source, medium = 'social', campaign = 'share', content = '') => {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    ...(content && { utm_content: content })
  });
  return params.toString();
};

// Enhanced share URL generators
export const shareUrls = {
  facebook: (url, title = '', description = '') => {
    const utmParams = generateUTMParameters('facebook', 'social', 'post_share');
    const shareUrl = `${url}?${utmParams}`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title + ' - ' + description)}`;
  },

  twitter: (url, title = '', hashtags = ['ITERConnect', 'StudentCollaboration']) => {
    const utmParams = generateUTMParameters('twitter', 'social', 'post_share');
    const shareUrl = `${url}?${utmParams}`;
    const tweetText = `${title}\n\n${shareUrl}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=${hashtags.join(',')}&via=_shaurya35`;
  },

  linkedin: (url, title = '', summary = '') => {
    const utmParams = generateUTMParameters('linkedin', 'social', 'post_share');
    const shareUrl = `${url}?${utmParams}`;
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
  },

  whatsapp: (url, title = '') => {
    const utmParams = generateUTMParameters('whatsapp', 'messaging', 'post_share');
    const shareUrl = `${url}?${utmParams}`;
    const message = `${title}\n\nCheck this out: ${shareUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  },

  telegram: (url, title = '') => {
    const utmParams = generateUTMParameters('telegram', 'messaging', 'post_share');
    const shareUrl = `${url}?${utmParams}`;
    const message = `${title}\n\n${shareUrl}`;
    return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  },

  reddit: (url, title = '') => {
    const utmParams = generateUTMParameters('reddit', 'social', 'post_share');
    const shareUrl = `${url}?${utmParams}`;
    return `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
  },

  email: (url, title = '', description = '') => {
    const utmParams = generateUTMParameters('email', 'email', 'post_share');
    const shareUrl = `${url}?${utmParams}`;
    const subject = `Check out: ${title}`;
    const body = `Hi,\n\nI thought you might be interested in this:\n\n${title}\n${description}\n\n${shareUrl}\n\nBest regards`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
};

// Enhanced native sharing with fallback
export const enhancedShare = async (shareData, fallbackPlatform = 'twitter') => {
  const { title, text, url, image } = shareData;

  // Try native sharing first (mobile devices)
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (error) {
      console.log('Native sharing cancelled or failed:', error);
    }
  }

  // Fallback to social media platform
  try {
    const shareUrl = shareUrls[fallbackPlatform](url, title, text);
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    return { success: true, method: fallbackPlatform };
  } catch (error) {
    console.error('Social sharing failed:', error);
    return { success: false, error };
  }
};

// Copy to clipboard with tracking
export const copyToClipboard = async (text, source = 'direct') => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    
    // Track copy action
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        method: 'copy',
        content_type: source,
        item_id: text
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Generate social media meta tags for dynamic content
export const generateSocialMetaTags = (content) => {
  const { title, description, image, url, type = 'article', author } = content;
  
  return {
    // Open Graph
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'og:url': url,
    'og:type': type,
    'og:site_name': 'ITER Connect',
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
    'twitter:creator': author ? `@${author.twitter}` : '@_shaurya35',
    'twitter:site': '@itersocialconnect',
    
    // Additional
    'article:author': author?.name,
    'article:published_time': content.publishedTime,
    'article:modified_time': content.modifiedTime
  };
};

// Social media verification meta tags
export const socialVerificationTags = {
  'google-site-verification': 'your-google-verification-code',
  'facebook-domain-verification': 'your-facebook-verification-code',
  'twitter:site:id': 'your-twitter-site-id',
  'pinterest-site-verification': 'your-pinterest-verification-code'
};

// SEO-friendly URL generator
export const generateSEOFriendlyURL = (title, id) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim('-'); // Remove leading/trailing hyphens
  
  return `${slug}-${id}`;
};

// Track social media engagement
export const trackSocialEngagement = (platform, action, contentId) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'social_engagement', {
      platform,
      action,
      content_id: contentId,
      event_category: 'Social Media',
      event_label: `${platform}_${action}`
    });
  }
  
  // Also track in your analytics service if available
  console.log(`Social engagement: ${platform} - ${action} - ${contentId}`);
};