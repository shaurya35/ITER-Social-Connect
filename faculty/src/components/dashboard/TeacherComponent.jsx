"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { BACKEND_URL } from "@/configs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Calendar, Clock, MapPin, LinkIcon, Mail } from "lucide-react";
import LeftPanel from "@/components/panels/LeftPanel";
import RightTopPanel from "@/components/panels/RightTopPanel";
import PanelsPreloader from "@/components/preloaders/PanelsPreloader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function TeacherComponent() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    eventTitle: "",
    eventType: "Workshop",
    eventAddress: "",
    eventDescription: "",
    eventDate: "",
    eventStartTime: "",
    eventEndTime: "",
    eventLink: "",
    eventContact: "",
  });
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      router.push("/signin");
      return;
    }
    fetchEvents();
  }, [accessToken, router]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/events`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setEvents(response.data.events);
    } catch (err) {
      setError("Failed to fetch events. Please try again.");
      console.error("Get Events Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Combine date and time
    const startDateTime = `${formData.eventDate}T${formData.eventStartTime}`;
    const endDateTime = `${formData.eventDate}T${formData.eventEndTime}`;
    
    try {
      await axios.post(
        `${BACKEND_URL}/api/events/create`,
        {
          ...formData,
          eventStartTime: startDateTime,
          eventEndTime: endDateTime
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setShowForm(false);
      setFormData({
        eventTitle: "",
        eventType: "Workshop",
        eventAddress: "",
        eventDescription: "",
        eventDate: "",
        eventStartTime: "",
        eventEndTime: "",
        eventLink: "",
        eventContact: "",
      });
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create event. Please try again.");
      console.error("Create Event Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const buttons = [
    {
      label: "Events",
      onClick: () => {},
      active: true,
      key: "events",
    },
  ];

  const renderEventCard = (event) => {
    const startDate = new Date(event.eventStartTime);
    const endDate = new Date(event.eventEndTime);
    
    return (
      <Card key={event.id} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200 mb-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {event.eventTitle}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {event.eventType}
            </span>
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(startDate, "MMM d, yyyy")}
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {event.eventDescription}
          </p>
          
          <div className="space-y-2">
            {event.eventAddress && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  {event.eventAddress}
                </span>
              </div>
            )}
            
            {event.eventLink && (
              <div className="flex items-start">
                <LinkIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <a 
                  href={event.eventLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {event.eventLink}
                </a>
              </div>
            )}
            
            <div className="flex items-start">
              <Mail className="h-4 w-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                {event.eventContact}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  let content;
  if (loading && !showForm) {
    content = <PanelsPreloader />;
  } else if (error) {
    content = (
      <div className="mb-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button onClick={fetchEvents}>Retry</Button>
        </div>
      </div>
    );
  } else {
    content = events.length > 0 ? (
      <div className="space-y-4">
        {events.map(renderEventCard)}
      </div>
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No events found.</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Event
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto h-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <LeftPanel
          heading="Event Management"
          subheading="Create and manage events"
          buttons={buttons}
        />

        <div className="flex-1">
          {!showForm && (
            <RightTopPanel
              placeholder="Search events..."
              buttonLabel="Add Event"
              buttonIcon={Plus}
              onButtonClick={() => setShowForm(true)}
              disabled={false}
            />
          )}

          {showForm ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Create New Event
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="eventTitle" className="text-gray-700 dark:text-gray-300">
                    Event Title *
                  </Label>
                  <Input
                    id="eventTitle"
                    name="eventTitle"
                    value={formData.eventTitle}
                    onChange={handleInputChange}
                    required
                    className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <Label htmlFor="eventType" className="text-gray-700 dark:text-gray-300">
                    Event Type *
                  </Label>
                  <select
                    id="eventType"
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mt-1"
                    required
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Conference">Conference</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="eventDescription" className="text-gray-700 dark:text-gray-300">
                    Description *
                  </Label>
                  <textarea
                    id="eventDescription"
                    name="eventDescription"
                    value={formData.eventDescription}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="eventDate" className="text-gray-700 dark:text-gray-300">
                      Date *
                    </Label>
                    <Input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      required
                      className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventStartTime" className="text-gray-700 dark:text-gray-300">
                        Start Time *
                      </Label>
                      <Input
                        type="time"
                        id="eventStartTime"
                        name="eventStartTime"
                        value={formData.eventStartTime}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventEndTime" className="text-gray-700 dark:text-gray-300">
                        End Time *
                      </Label>
                      <Input
                        type="time"
                        id="eventEndTime"
                        name="eventEndTime"
                        value={formData.eventEndTime}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="eventAddress" className="text-gray-700 dark:text-gray-300">
                    Location (Physical)
                  </Label>
                  <Input
                    id="eventAddress"
                    name="eventAddress"
                    value={formData.eventAddress}
                    onChange={handleInputChange}
                    className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Building, Room Number"
                  />
                </div>

                <div>
                  <Label htmlFor="eventLink" className="text-gray-700 dark:text-gray-300">
                    Online Link (If virtual)
                  </Label>
                  <Input
                    id="eventLink"
                    name="eventLink"
                    type="url"
                    value={formData.eventLink}
                    onChange={handleInputChange}
                    className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div>
                  <Label htmlFor="eventContact" className="text-gray-700 dark:text-gray-300">
                    Contact Information *
                  </Label>
                  <Input
                    id="eventContact"
                    name="eventContact"
                    value={formData.eventContact}
                    onChange={handleInputChange}
                    required
                    className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Email or phone number"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}