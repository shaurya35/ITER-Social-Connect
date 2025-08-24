import { WebSocketProvider } from "@/contexts/WebSocketContext"

export const metadata = {
  title: "Messages / ITER Connect",
  description: "Connect, Collaborate, and Grow - Chat with your peers",
}

const ChatLayout = (props) => {
  return (
    <WebSocketProvider>
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-screen flex flex-col max-w-6xl mx-auto">
          <div className="flex-1 overflow-hidden">{props.children}</div>
        </div>
      </div>
    </WebSocketProvider>
  )
}

export default ChatLayout
