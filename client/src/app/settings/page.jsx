import SettingsComponent from "@/components/settings/SettingsComponent"

export default function Connection() {
  return <>
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="container mx-auto flex justify-center items-start">
          <div className="flex flex-row justify-center gap-5 max-w-6xl w-full">
            <div className="flex-1 py-5 overflow-y-auto">
              <SettingsComponent/>
            </div>
          </div>
        </main>
      </div>
  </>;
}
