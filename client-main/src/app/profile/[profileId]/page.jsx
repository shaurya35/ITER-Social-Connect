import CommunityProfile from "@/components/communityprofile/CommunityProfile";

export default async function Connection({ params }) {
  const { profileId } = await params;
  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="container mx-auto flex justify-center items-start">
          <div className="flex flex-row justify-center gap-5 max-w-5xl w-full">
            <div className="flex-1 py-5 overflow-y-auto">
              <CommunityProfile profileId={profileId} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
