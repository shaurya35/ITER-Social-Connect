export const metadata = {
  title: "Messages / ITER Connect",
  description: "Connect, Collaborate, and Grow - Chat with your peers",
};

const ChatLayout = (props) => {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      {/* Full height layout with proper theming */}
      <div className="h-screen flex flex-col max-w-6xl mx-auto">
        <div className="flex-1 overflow-hidden">{props.children}</div>
      </div>
    </div>
  );
};

export default ChatLayout;
