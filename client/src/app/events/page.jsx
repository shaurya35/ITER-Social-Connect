import EventComponent from "@/components/connections/EventComponent"

export default function Connection() {
  return <>
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="container mx-auto flex justify-center items-start">
          <div className="flex flex-row justify-center gap-5 max-w-7xl w-full">
            <div className="flex-1 py-5 overflow-y-auto">
              <EventComponent/>
            </div>
          </div>
        </main>
      </div>
  </>;
}
