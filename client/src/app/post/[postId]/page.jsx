import LeftSidebar from "@/components/home/main/LeftSidebar";
import RightSidebar from "@/components/home/main/RightSidebar";
import SinglePost from "@/components/posts/SinglePost";

export default async function Post({ params }) {
  const { postId } = await params;
  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="container mx-auto  flex justify-center items-start">
          <div className="flex flex-row justify-center gap-5 max-w-7xl w-full">
            <div className="hidden xl:block lg:w-64 sticky pt-5 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <LeftSidebar />
            </div>
            <div className="flex-1 py-5 overflow-y-auto">
              <SinglePost postId={postId} />
            </div>
            <div className="hidden xl:block lg:w-80 sticky pt-5 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <RightSidebar />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
