import CompleteProfile from "@/components/auth/CompleteProfile";

export const metadata = {
  title: "Complete / ITER Connect",
  description: "Create a new ITER Connect account",
};

export default function Complete() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* <Navbar /> */}
      <div className="flex-grow flex flex-col items-center justify-start pt-9 sm:pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              Create a new account
            </h2>
          </div>
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <CompleteProfile />
          </div>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <a
              href="/signin"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              sign in to your existing account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
