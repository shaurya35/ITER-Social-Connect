import Navbar from "@/components/home/navbar/Navbar"
import LeftSidebar from "@/components/home/main/LeftSidebar";
import MainFeed from "@/components/home/main/MainFeed";
import RightSidebar from "@/components/home/main/RightSidebar";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />
        <main className="container mx-auto bg-red-200 flex justify-center">
          <div className="flex flex-row items-center justify-center gap-8 max-w-7xl bg-purple-300">
            <div className="hidden lg:block lg:w-64 bg-green-900">
              <LeftSidebar/>
            </div>
            <MainFeed/>
            <div className="hidden lg:block lg:w-80 bg-red-900">
              <RightSidebar/>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
