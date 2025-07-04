export function formatMessageTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const minutes = Math.floor((now - date) / (1000 * 60))
    return minutes < 1 ? "now" : `${minutes}m`
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffInHours < 48) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString()
  }
}

export function formatConversationTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffInDays === 1) {
    return "Yesterday"
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" })
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }
}
