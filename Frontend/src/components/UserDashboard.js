import React, { useState, useEffect } from "react";
import { fetchEvents } from "../api/events";
import { getUserBookings } from "../api/bookings";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import QRCode from 'react-qr-code';
import ReactModal from 'react-modal';
import { useLocation } from "react-router-dom";

// Helper to format time to 12-hour with AM/PM
function formatTimeTo12Hour(time24) {
  if (!time24) return "";
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

const UserDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state && location.state.activeTab) {
      return location.state.activeTab;
    }
    return "browse";
  });
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  // Track expanded state for each event by ID
  const [expandedEvents, setExpandedEvents] = useState({});
  const [ticketView, setTicketView] = useState('list'); // 'list' or 'calendar'
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarBookings, setCalendarBookings] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventsData, bookingsData] = await Promise.all([
          fetchEvents(),
          getUserBookings(),
        ]);
        setEvents(eventsData);
        setBookings(bookingsData);
      } catch (err) {
        setError("Failed to load data");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Optionally, add an effect to update the tab if location.state changes after mount
  useEffect(() => {
    if (location.state && location.state.activeTab && location.state.activeTab !== activeTab) {
      setActiveTab(location.state.activeTab);
    }
    // eslint-disable-next-line
  }, [location.state]);

  // Use real bookings data instead of mock data

  const categories = [
    "All",
    "Technology",
    "Entertainment",
    "Business",
    "Arts",
    "Sports",
    "Movies",
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6 px-2 w-full" style={{ maxWidth: 1200 }}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
          Discover Events
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Browse upcoming events and manage your tickets
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab("browse")}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm ${
              activeTab === "browse"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Browse Events
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm ${
              activeTab === "tickets"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            My Tickets ({bookings.length})
          </button>
        </nav>
      </div>

      {/* Browse Events Tab */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          {/* Categories Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
            <div className="flex flex-wrap gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 sm:px-4 py-2 rounded-full transition-colors text-xs sm:text-sm font-medium whitespace-nowrap
                  ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex justify-end w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full sm:w-72 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-8 text-blue-600 font-semibold">
              Loading events...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 font-semibold">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(() => {
                const filtered = events.filter(
                  (ev) =>
                    (selectedCategory === "All" ||
                      ev.category === selectedCategory) &&
                    (ev.name?.toLowerCase().includes(search.toLowerCase()) ||
                      ev.description
                        ?.toLowerCase()
                        .includes(search.toLowerCase()) ||
                      ev.venue?.toLowerCase().includes(search.toLowerCase()))
                );
                if (filtered.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12">
                      <h3 className="text-lg font-medium text-slate-800 mb-1">
                        No events found
                      </h3>
                      <p className="text-slate-600 text-sm">
                        Try a different category or search term.
                      </p>
                    </div>
                  );
                }
                return filtered.map((event) => {
                  const isLong =
                    event.description && event.description.length > 120;
                  const expanded = expandedEvents[event._id] || false;
                  return (
                    <div
                      key={event._id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow min-w-0"
                    >
                      <div className="h-40 sm:h-48 bg-slate-200 relative flex flex-col justify-end">
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="w-full flex justify-end pb-2 pr-2 absolute bottom-0 right-0">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium mb-1">
                            {event.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">
                          {event.name}
                        </h3>
                        {/* Fixed height for description + Read More for perfect alignment */}
                        <div
                          style={{
                            minHeight: 64,
                            maxHeight: 64,
                            overflow: "hidden",
                            marginBottom: 24,
                          }}
                        >
                          <p
                            className={`text-slate-600 text-xs sm:text-sm ${
                              !expanded && isLong ? "line-clamp-2" : ""
                            }`}
                          >
                            {event.description}
                          </p>
                          {isLong ? (
                            <button
                              className="text-blue-600 text-xs font-medium focus:outline-none mt-1"
                              onClick={() =>
                                setExpandedEvents((prev) => ({
                                  ...prev,
                                  [event._id]: !prev[event._id],
                                }))
                              }
                            >
                              {expanded ? "Show Less" : "Read More"}
                            </button>
                          ) : (
                            <div
                              style={{ height: 24 }}
                              aria-hidden="true"
                            ></div>
                          )}
                        </div>
                        {/* Date and Venue always perfectly aligned and further down */}
                        <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4 pt-2">
                          <div className="flex items-center text-xs sm:text-sm text-slate-600">
                            <span className="mr-2">📅</span>
                            {event.date} at {formatTimeTo12Hour(event.time)}
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-slate-600">
                            <span className="mr-2">📍</span>
                            {event.venue}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-base sm:text-lg text-slate-800">
                            {typeof event.ticketPrice === "number"
                              ? `$${event.ticketPrice}`
                              : ""}
                          </span>
                          <button
                            onClick={() =>
                              (window.location.href = `/event/${event._id}`)
                            }
                            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {/* My Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <button
              className={`px-4 py-2 rounded-l-lg border border-blue-500 text-sm font-medium focus:outline-none ${ticketView === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
              onClick={() => setTicketView('list')}
            >
              List View
            </button>
            <button
              className={`px-4 py-2 rounded-r-lg border border-blue-500 text-sm font-medium focus:outline-none ${ticketView === 'calendar' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
              onClick={() => setTicketView('calendar')}
            >
              Calendar View
            </button>
          </div>
          {ticketView === 'list' ? (
            bookings.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="max-w-md mx-auto">
                  {/* Empty State Illustration */}
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    No tickets yet
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Start exploring amazing events and book your first ticket to see them here!
                  </p>
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Browse Events
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow flex flex-col h-full"
                    style={{ minHeight: 0, maxWidth: 400, margin: '0 auto' }}
                  >
                    {/* Event image */}
                    {booking.eventId?.imageUrl && (
                      <div className="h-28 sm:h-32 bg-slate-200 relative flex flex-col justify-end rounded-t-xl overflow-hidden">
                        <img
                          src={booking.eventId.imageUrl}
                          alt={booking.eventId.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="border-t border-slate-100"></div>
                    <div className="p-4 flex flex-col flex-1 min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(booking.paymentStatus)}`}
                        >
                          Payment: {booking.paymentStatus}
                        </span>
                        <h3 className="text-base font-bold text-slate-800 truncate max-w-[140px]" title={booking.eventId?.name}>
                          {booking.eventId?.name || "Event"}
                        </h3>
                      </div>
                      <div className="flex items-center text-xs text-slate-600 mb-1 truncate" title={booking.eventId?.date + ' at ' + formatTimeTo12Hour(booking.eventId?.time)}>
                        <span className="mr-2">📅</span>
                        {booking.eventId?.date} at {formatTimeTo12Hour(booking.eventId?.time)}
                      </div>
                      <div className="flex items-center text-xs text-slate-600 mb-1 truncate" title={booking.eventId?.venue}>
                        <span className="mr-2">📍</span>
                        {booking.eventId?.venue}
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Seat:</span>
                        <span className="font-medium text-slate-800">
                          {booking.seatNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-600">Price:</span>
                        <span className="font-medium text-slate-800">
                          ${booking.ticketPrice}
                        </span>
                      </div>
                      <div className="flex flex-col items-center mt-2 mb-3">
                        <span className="text-xs text-slate-500 mb-1">QR Code</span>
                        <div className="bg-white p-1 rounded border w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                          <QRCode value={booking.qrCode || ''} size={window.innerWidth < 640 ? 64 : 48} />
                        </div>
                      </div>
                      <div className="mt-auto pt-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setModalOpen(true);
                          }}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
                        >
                          View Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <Calendar
                onClickDay={(date) => {
                  const bookingsForDate = bookings.filter((booking) => {
                    const bookingDate = new Date(booking.eventId?.date);
                    return (
                      bookingDate.getFullYear() === date.getFullYear() &&
                      bookingDate.getMonth() === date.getMonth() &&
                      bookingDate.getDate() === date.getDate()
                    );
                  });
                  if (bookingsForDate.length > 0) {
                    setSelectedCalendarDate(date);
                    setCalendarBookings(bookingsForDate);
                    setModalOpen(true);
                  }
                }}
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const bookingsForDate = bookings.filter((booking) => {
                      const bookingDate = new Date(booking.eventId?.date);
                      return (
                        bookingDate.getFullYear() === date.getFullYear() &&
                        bookingDate.getMonth() === date.getMonth() &&
                        bookingDate.getDate() === date.getDate()
                      );
                    });
                    if (bookingsForDate.length > 0) {
                      // Get unique event times for this date
                      const eventTimes = [...new Set(bookingsForDate.map(booking => 
                        formatTimeTo12Hour(booking.eventId?.time)
                      ))].join(', ');
                      
                      return (
                        <div className="relative group cursor-pointer">
                          <span className="block text-xs font-semibold text-blue-600 text-center bg-blue-50 px-1 py-0.5 rounded">
                            {bookingsForDate.length} ticket(s)
                          </span>
                          {/* Improved Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-20 min-w-max">
                            <div className="text-center">
                              <div className="font-medium text-blue-300 mb-0.5">Event Times</div>
                              <div className="text-white">{eventTimes}</div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
                tileClassName={({ date, view }) => {
                  if (view === 'month') {
                    const hasBooking = bookings.some((booking) => {
                      const bookingDate = new Date(booking.eventId?.date);
                      return (
                        bookingDate.getFullYear() === date.getFullYear() &&
                        bookingDate.getMonth() === date.getMonth() &&
                        bookingDate.getDate() === date.getDate()
                      );
                    });
                    return hasBooking ? 'bg-blue-100 border-blue-400 border-2 rounded-lg' : null;
                  }
                  return null;
                }}
              />
              <div className="mt-4">
                <span className="text-xs text-slate-500">
                  Click on a date to see your bookings for that day.
                </span>
              </div>
            </div>
          )}
          {/* Ticket Details Modal */}
          <ReactModal
            isOpen={modalOpen && !!selectedBooking && calendarBookings.length === 0}
            onRequestClose={() => { setModalOpen(false); setSelectedBooking(null); }}
            ariaHideApp={false}
            className="fixed inset-0 flex items-center justify-center z-50 outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
          >
            {selectedBooking && (
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                {selectedBooking.eventId?.imageUrl && (
                  <img
                    src={selectedBooking.eventId.imageUrl}
                    alt={selectedBooking.eventId.name}
                    className="w-full h-40 object-cover rounded-lg mb-4 border"
                  />
                )}
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  {selectedBooking.eventId?.name}
                </h2>
                <div className="flex items-center text-sm text-slate-600 mb-2">
                  <span className="mr-2">📅</span>
                  {selectedBooking.eventId?.date} at {formatTimeTo12Hour(selectedBooking.eventId?.time)}
                </div>
                <div className="flex items-center text-sm text-slate-600 mb-2">
                  <span className="mr-2">📍</span>
                  {selectedBooking.eventId?.venue}
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Seat:</span>
                  <span className="font-medium text-slate-800">
                    {selectedBooking.seatNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Price:</span>
                  <span className="font-medium text-slate-800">
                    ${selectedBooking.ticketPrice}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Payment:</span>
                  <span className={`font-medium ${getStatusColor(selectedBooking.paymentStatus)}`}>
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
                <div className="flex flex-col items-center mt-4">
                  <span className="text-xs text-slate-500 mb-1">QR Code</span>
                  <div className="bg-white p-2 rounded border w-32 h-32 flex items-center justify-center">
                    <QRCode value={selectedBooking.qrCode || ''} size={128} />
                  </div>
                </div>
              </div>
            )}
          </ReactModal>
          {/* Calendar Bookings Modal */}
          <ReactModal
            isOpen={modalOpen && calendarBookings.length > 0}
            onRequestClose={() => { setModalOpen(false); setCalendarBookings([]); }}
            ariaHideApp={false}
            className="fixed inset-0 flex items-center justify-center z-50 outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xl font-bold"
                onClick={() => { setModalOpen(false); setCalendarBookings([]); }}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Bookings for {selectedCalendarDate && selectedCalendarDate.toLocaleDateString()}</h2>
              {calendarBookings.map((booking) => (
                <div key={booking._id} className="flex items-center gap-3 mb-4 p-2 rounded-lg border hover:shadow">
                  {booking.eventId?.imageUrl && (
                    <img
                      src={booking.eventId.imageUrl}
                      alt={booking.eventId.name}
                      className="w-12 h-12 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-xs sm:text-sm">{booking.eventId?.name}</div>
                    <div className="text-xs text-slate-600">Seat: {booking.seatNumber}</div>
                    <div className="text-xs text-slate-600">Time: {formatTimeTo12Hour(booking.eventId?.time)}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setCalendarBookings([]);
                      setModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    View Ticket
                  </button>
                </div>
              ))}
            </div>
          </ReactModal>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
