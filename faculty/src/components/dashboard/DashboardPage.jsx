"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { useProfile } from "@/contexts/ProfileContext";
import TeacherComponent from "@/components/dashboard/TeacherComponent";
import AdminComponent from "@/components/dashboard/AdminComponent";
import PanelsPreloader from "@/components/preloaders/PanelsPreloader";

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading, accessToken } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  
  // Admin email from environment variables
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  // Verify admin status
  useEffect(() => {
    if (authUser && authUser.email === ADMIN_EMAIL) {
      setIsAdmin(true);
      setAdminLoading(false);
    } else {
      setIsAdmin(false);
      setAdminLoading(false);
    }
  }, [authUser, ADMIN_EMAIL]);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser && !isAdmin) {
      router.push("/signin");
    }
  }, [authLoading, authUser, isAdmin, router]);

  // Show loading state while checking auth
  if (authLoading || (!isAdmin && profileLoading) || adminLoading) {
    return <PanelsPreloader />;
  }

  // If not authenticated, return null (already redirecting)
  if (!authUser && !isAdmin) {
    return null;
  }

  // Admin user
  if (isAdmin) {
    return <AdminComponent />;
  }

  // Teacher user
  if (profile && profile.role === "teacher") {
    return <TeacherComponent />;
  }

  // Unauthorized access
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-3">
          Access Restricted
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-5">
          This dashboard is only accessible to teachers and administrators.
        </p>
        <button
          onClick={() => router.push("/explore")}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}