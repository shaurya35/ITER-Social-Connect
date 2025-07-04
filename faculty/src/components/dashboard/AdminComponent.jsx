"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/contexts/AuthProvider";
import { BACKEND_URL } from "@/configs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "@/components/preloaders/PanelsPreloader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminComponent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState({ type: "", message: "" });
  const { accessToken } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!accessToken) {
      router.push("/signin");
    }
  }, [accessToken, router]);

  const buttons = [
    {
      label: "Reports",
      onClick: () => setActiveTab("reports"),
      active: activeTab === "reports",
      key: "reports",
    },
    {
      label: "OTP Management",
      onClick: () => setActiveTab("otps"),
      active: activeTab === "otps",
      key: "otps",
    },
    {
      label: "Notifications",
      onClick: () => setActiveTab("notifications"),
      active: activeTab === "notifications",
      key: "notifications",
    },
  ];

  const fetchReports = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/reports`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setReports(response.data.reports);
    } catch (err) {
      if (err.response?.status === 401) {
        router.push("/signin");
      } else {
        setError("Failed to fetch reports");
        console.error("Get Reports Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && activeTab === "reports") {
      fetchReports();
    }
  }, [accessToken, activeTab]);

  const handleDeleteExpiredOTPs = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setActionStatus({ type: "", message: "" });
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/delete-expired-otps`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setActionStatus({
        type: "success",
        message: `Deleted ${response.data.deletedCount} expired OTPs`
      });
    } catch (err) {
      if (err.response?.status === 401) {
        router.push("/signin");
      } else {
        setActionStatus({
          type: "error",
          message: "Failed to delete expired OTPs"
        });
        console.error("Delete OTPs Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOldNotifications = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setActionStatus({ type: "", message: "" });
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/delete-old-notifications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setActionStatus({
        type: "success",
        message: "Deleted old notifications successfully"
      });
    } catch (err) {
      if (err.response?.status === 401) {
        router.push("/signin");
      } else {
        setActionStatus({
          type: "error",
          message: "Failed to delete old notifications"
        });
        console.error("Delete Notifications Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };
  const renderReportCard = (report) => (
    <Card key={report.id} className="bg-white dark:bg-gray-800 mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {report.type === "post" ? "Post Report" : "User Report"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-200">Reported By:</p>
            <p className="text-gray-700 dark:text-gray-300">{report.reportedBy}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-200">Target:</p>
            <p className="text-gray-700 dark:text-gray-300">
              {report.type === "post" 
                ? `Post ID: ${report.postId}` 
                : `User ID: ${report.userId}`}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-200">Date:</p>
            <p className="text-gray-700 dark:text-gray-300">
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="font-medium text-gray-900 dark:text-gray-200">Reason:</p>
          <p className="text-gray-700 dark:text-gray-300">{report.reason}</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            View Details
          </Button>
          <Button
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderOTPManagement = () => (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle>OTP Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Delete all expired OTPs from the system to maintain security and free up storage.
          </p>
          
          {actionStatus.type && (
            <Alert variant={actionStatus.type === "success" ? "success" : "destructive"}>
              {actionStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {actionStatus.type === "success" ? "Success" : "Error"}
              </AlertTitle>
              <AlertDescription>
                {actionStatus.message}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleDeleteExpiredOTPs}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Processing..." : "Delete Expired OTPs"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderNotificationManagement = () => (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle>Notification Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Delete all notifications older than 7 days to optimize system performance.
          </p>
          
          {actionStatus.type && (
            <Alert variant={actionStatus.type === "success" ? "success" : "destructive"}>
              {actionStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {actionStatus.type === "success" ? "Success" : "Error"}
              </AlertTitle>
              <AlertDescription>
                {actionStatus.message}
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleDeleteOldNotifications}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Processing..." : "Delete Old Notifications"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  let content;
  if (loading) {
    content = <PanelsPreloader />;
  } else if (error) {
    content = (
      <div className="mb-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button onClick={fetchReports}>Retry</Button>
        </div>
      </div>
    );
  } else {
    switch (activeTab) {
      case "reports":
        content = reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map(renderReportCard)}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No reports found.</p>
          </div>
        );
        break;
      case "otps":
        content = renderOTPManagement();
        break;
      case "notifications":
        content = renderNotificationManagement();
        break;
      default:
        content = null;
    }
  }

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <LeftPanel
          heading="Admin Dashboard"
          subheading="Manage platform operations"
          buttons={buttons}
        />

        <div className="flex-1">
          <RightTopPanel
            placeholder={
              activeTab === "reports" 
                ? "Search reports..." 
                : "Search management tools..."
            }
            buttonLabel={
              activeTab === "reports" 
                ? "Generate Report" 
                : "Execute Action"
            }
            onButtonClick={() => {
              if (activeTab === "reports") {
                // Implement report generation
              } else if (activeTab === "otps") {
                handleDeleteExpiredOTPs();
              } else if (activeTab === "notifications") {
                handleDeleteOldNotifications();
              }
            }}
            disabled={false}
          />

          <div className="space-y-4">{content}</div>
        </div>
      </div>
    </div>
  );
}