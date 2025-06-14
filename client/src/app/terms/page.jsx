"use client";

// import { Button } from "@/components/ui/button";
// import { Alert } from "@/components/ui/alert";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Terms of Service
        </h1>

        <div className="prose dark:prose-invert text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h2 className="text-md font-semibold">1. Acceptance of Terms</h2>
            <p className="text-sm">
              By using this platform, you agree to these Terms of Service. If
              you disagree, do not use the platform. This service is provided
              "as is" for students, faculty, alumni, and staff of Institute of Technical Education & Research.
            </p>
          </section>

          <section>
            <h2 className="text-md font-semibold">2. Eligibility</h2>
            <p className="text-sm">You must be: </p>
            <ul className="list-disc pl-6 space-y-2 text-sm pt-2">
              <li>
                A current student, faculty member, alumni, or staff of Institute of Technical Education & Research
              </li>
              <li>
                At least 18 years old
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-md font-semibold">3. User Responsibilities</h2>
            <p className="text-sm">You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm  pt-2">
              <li>
                Use the platform <strong>only for lawful purposes</strong>
              </li>
              <li>
                <strong>Not post harmful content</strong> including hate speech
                or harassment
              </li>
              <li>Keep your account credentials secure</li>
              <li>Verify opportunities/jobs before applying</li>
            </ul>
          </section>

          <section>
            <h2 className="text-md font-semibold">4. Prohibited Actions</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm  pt-2">
              <li>Impersonating others or sharing false information</li>
              <li>Posting copyrighted material without permission</li>
              <li>Commercial advertising or scams</li>
              <li>Harassment or privacy violations</li>
            </ul>
          </section>

          {/* <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-col text-center items-center justify-center gap-2">
              <span className="font-semibold">Important:</span>
              This platform is currently unofficial and not officially endorsed
              by the college.
            </div>
          </Alert> */}

          <section>
            <h2 className="text-md font-semibold">Contact</h2>
            <p className="text-sm">
              Report issues or ask questions at:
              <br />
              Email: itersocialconnect@gmail.com
              <br />
              Faculty Advisor: Bharat Jyoti Ranjan Sir
            </p>
          </section>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last Updated: 02/04/2025
            </p>
          </div>
        </div>

        <div className="mt-8">
          {/* <Button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
          >
            Back to Signup
          </Button> */}
        </div>
      </div>
    </div>
  );
}
