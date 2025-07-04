// Avatar Cache Utility - Stores user avatars in memory for fast access
class AvatarCache {
  constructor() {
    this.cache = new Map()
    this.maxSize = 100 // Limit cache size to prevent memory issues
  }

  // Set avatar for a user
  setAvatar(userId, avatarUrl, userName = null) {
    if (!userId || !avatarUrl) return

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(userId, {
      url: avatarUrl,
      name: userName,
      timestamp: Date.now(),
    })

  }

  // Get avatar for a user
  getAvatar(userId) {
    if (!userId) return null

    const cached = this.cache.get(userId)
    if (cached) {
      return cached.url
    }

    return null
  }

  // Get user info from cache
  getUserInfo(userId) {
    if (!userId) return null
    return this.cache.get(userId) || null
  }

  // Preload avatars from conversation data
  preloadFromConversations(conversations, currentUserId) {

    conversations.forEach((conv) => {
      // Cache other user's avatar
      if (conv.otherUser && conv.otherUser.id && conv.otherUser.avatar) {
        this.setAvatar(conv.otherUser.id, conv.otherUser.avatar, conv.otherUser.name)
      }

      // Cache all participants
      if (conv.participants) {
        conv.participants.forEach((participant) => {
          if (participant.id && participant.avatar) {
            this.setAvatar(participant.id, participant.avatar, participant.name)
          }
        })
      }
    })

  }

  // Preload avatars from messages
  preloadFromMessages(messages) {

    messages.forEach((message) => {
      if (message.senderId && message.senderAvatar) {
        this.setAvatar(message.senderId, message.senderAvatar)
      }
    })

  }

  // Clear cache
  clear() {
    this.cache.clear()
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      users: Array.from(this.cache.keys()),
    }
  }
}

// Create singleton instance
const avatarCache = new AvatarCache()

export default avatarCache
