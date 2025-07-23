import React, { useState, useEffect } from "react";
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import DeleteEventModal from "./DeleteEventModal";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../api/events";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrganizerPanel = ({ user }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/events/organizer/${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEvents(data.events);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);
  const [error, setError] = useState(null);

  // Fetch events from backend
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError("Failed to load events");
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadEvents();
  }, []);

  // Add event handler
  const handleAddEvent = async (formData) => {
    try {
      await createEvent(formData);
      setShowAddModal(false);
      loadEvents();
      toast.success("Event created successfully!");
    } catch (err) {
      toast.error("Failed to create event");
    }
  };

  // Edit event handler
  const handleEditEventSubmit = async (formData) => {
    try {
      await updateEvent(selectedEvent._id, formData);
      setShowEditModal(false);
      setSelectedEvent(null);
      loadEvents();
      toast.success("Event updated successfully!");
    } catch (err) {
      toast.error("Failed to update event");
    }
  };

  // Delete event handler
  const handleDeleteEventConfirm = async () => {
    try {
      await deleteEvent(selectedEvent._id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      loadEvents();
      toast.success("Event deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete event");
    }
  };

  // Sell tickets handler (for testing)
  const handleSellTickets = async (event) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/events/${event._id}/sell-tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ quantity: 1 }),
        }
      );

      const data = await response.json();
      if (data.success) {
        loadEvents();
        toast.success(`Ticket sold for $${data.data.ticketPrice}!`);
      } else {
        toast.error(data.message || "Failed to sell ticket");
      }
    } catch (err) {
      toast.error("Failed to sell ticket");
    }
  };

  // Calculate KPIs
  const now = new Date();
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => {
    if (!e.date) return false;
    // Combine date and time for accurate comparison
    const eventDateTime = new Date(`${e.date}T${e.time || "00:00"}`);
    return eventDateTime > now;
  }).length;
  const totalRevenue = events.reduce(
    (sum, e) => sum + (typeof e.revenue === "number" ? e.revenue : 0),
    0
  );
  const totalAttendees = events.reduce(
    (sum, e) =>
      sum +
      (Array.isArray(e.attendees) ? e.attendees.length : e.attendees ?? 0),
    0
  );

  const stats = [
    { title: "Total Events", value: events.length },
    {
      title: "Active Events",
      value: events.filter((e) => e.status === "active").length,
    },
    { title: "Total Revenue", value: `$${totalRevenue.toLocaleString()}` },
    {
      title: "Total Attendees",
      value: events.reduce((sum, e) => sum + (e.attendees || 0), 0),
    },
  ];

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6 w-full px-0" style={{ maxWidth: "100%" }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
            Event Management
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Create and manage your events
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 text-xs sm:text-sm"
        >
          <span>+</span>
          <span>Add Event</span>
        </button>
        <AddEventModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddEvent}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
            Total Events
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">
            {loading ? "..." : totalEvents}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
            Active Events
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">
            {loading ? "..." : activeEvents}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
            Total Revenue
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">
            {loading ? "..." : `$${totalRevenue.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
            Total Attendees
          </p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">
            {loading ? "..." : totalAttendees}
          </p>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
            Your Events
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Event
                </th>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Date & Time
                </th>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Venue
                </th>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Ticket Price
                </th>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Sold/Available
                </th>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Revenue
                </th>
                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 whitespace-normal">
                    <div>
                      <div className="font-medium text-slate-800">
                        {event.name}
                      </div>
                      <div className="text-slate-500">{event.category}</div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-normal">
                    <div className="text-slate-800">{event.date}</div>
                    <div className="text-slate-500">{event.time}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-normal text-slate-800">
                    {event.venue}
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-normal">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        event.status
                      )}`}
                    >
                      {(() => {
                        if (!event.date) return "-";
                        const eventDateTime = new Date(
                          `${event.date}T${event.time || "00:00"}`
                        );
                        return eventDateTime > now ? "Upcoming" : "-";
                      })()}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-normal text-slate-800">
                    <div className="font-medium">${event.ticketPrice || 0}</div>
                    {event.dynamicPricing?.enabled && (
                      <div className="text-xs text-slate-500">
                        Dynamic pricing enabled
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-normal text-slate-800">
                    {event.soldTickets || 0}/
                    {event.totalSeats || event.capacity || 0}
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-normal font-medium text-slate-800">
                    ${(event.revenue || 0).toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-3 whitespace-normal font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-blue-600 hover:text-blue-900 transition-colors text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="text-red-600 hover:text-red-900 transition-colors text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddEventModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddEvent}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          event={selectedEvent}
          onSubmit={handleEditEventSubmit}
        />
      )}

      {showDeleteModal && selectedEvent && (
        <DeleteEventModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          event={selectedEvent}
          onConfirm={handleDeleteEventConfirm}
        />
      )}
    </div>
  );
};

export default OrganizerPanel;
