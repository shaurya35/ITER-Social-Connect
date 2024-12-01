import Navbar from "@/components/home/navbar/Navbar";
import LeftSidebar from "@/components/home/main/LeftSidebar";
import MainFeed from "@/components/home/main/MainFeed";
import RightSidebar from "@/components/home/main/RightSidebar";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* <Navbar /> */}
        <main className="container mx-auto  flex justify-center items-start">
          <div className="flex flex-row justify-center gap-5 max-w-7xl  w-full">
            <div className="hidden lg:block lg:w-64  sticky pt-5 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <LeftSidebar />
            </div>
            <div className="flex-1 py-5">
              <MainFeed />
            </div>
            <div className="hidden lg:block lg:w-96  sticky pt-5 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <RightSidebar />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

