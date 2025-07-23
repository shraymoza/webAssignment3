import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminDashboard = () => {
  const [kpi, setKpi] = useState({
    totalUsers: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalRevenue: 0,
  });
  const [events, setEvents] = useState([]);

  const recentActivities = [
    {
      id: 1,
      action: "New user registered",
      user: "john@example.com",
      time: "2 minutes ago",
    },
    {
      id: 2,
      action: "Event created",
      user: "Tech Conference 2024",
      time: "15 minutes ago",
    },
    { id: 3, action: "Payment processed", user: "$150.00", time: "1 hour ago" },
    {
      id: 4,
      action: "User role updated",
      user: "admin@example.com",
      time: "2 hours ago",
    },
  ];

  // --- Manage Users State ---
  const [users, setUsers] = useState({ admin: [], organizer: [], user: [] });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "organizer",
  });
  const [addStatus, setAddStatus] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");

  // Accordion state for Manage Users modal
  const [openRoles, setOpenRoles] = useState(["admin"]);

  // Fetch users function (move outside useEffect)
  const API_URL = process.env.REACT_APP_API_URL;
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/users`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) {}
    setLoadingUsers(false);
  };

  // Fetch KPIs (users and organizers)
  const fetchKPI = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/users`);
      const data = await res.json();
      let totalUsers = 0,
        totalOrganizers = 0;
      if (data.success) {
        totalUsers = data.users.user?.length || 0;
        totalOrganizers = data.users.organizer?.length || 0;
      }
      // Fetch events for totalEvents and revenue
      let totalEvents = 0;
      let totalRevenue = 0;
      try {
        const resEv = await fetch(`${API_URL}/api/events`);
        const dataEv = await resEv.json();
        if (dataEv.success) {
          const eventsData = dataEv.events || dataEv.data?.events || [];
          totalEvents = eventsData.length;
          totalRevenue = eventsData.reduce(
            (sum, event) => sum + (event.revenue || 0),
            0
          );
        }
      } catch {}
      setKpi({
        totalUsers,
        totalOrganizers,
        totalEvents,
        totalRevenue: totalRevenue.toLocaleString(),
      });
    } catch {}
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/events`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      // For admin, events are in data.data.events
      if (data.success && data.data && data.data.events)
        setEvents(data.data.events);
      else if (data.success && data.events) setEvents(data.events); // fallback for older API
    } catch {}
  };

  useEffect(() => {
    fetchKPI();
    fetchEvents();
    fetchUsers();
  }, []);

  // Add user handler
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    // Check for duplicate email in any role
    const allUsers = [
      ...(users.admin || []),
      ...(users.organizer || []),
      ...(users.user || []),
    ];
    if (
      allUsers.some(
        (u) => u.email.toLowerCase() === addForm.email.toLowerCase()
      )
    ) {
      toast.error(
        "User already exists, please change their role using the dropdown."
      );
      setAddLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invite sent successfully!");
        setAddForm({ name: "", email: "", phoneNumber: "", role: "user" });
        setShowAddModal(false);
      } else {
        toast.error(data.message || "Failed to add user");
      }
    } catch (e) {
      toast.error("Failed to add user");
    }
    setAddLoading(false);
  };

  const handleRoleChange = async (email, newRole) => {
    setUsers((prevUsers) => {
      let updated = { admin: [], organizer: [], user: [] };
      Object.keys(prevUsers).forEach((role) => {
        updated[role] = prevUsers[role].filter((u) => u.email !== email);
      });
      const userObj = Object.values(prevUsers)
        .flat()
        .find((u) => u.email === email);
      if (userObj) {
        updated[newRole] = [...updated[newRole], { ...userObj, role: newRole }];
      }
      return updated;
    });
    try {
      const res = await fetch(`${API_URL}/api/auth/users/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Role updated and user notified by email.");
        await fetchUsers();
      } else {
        toast.error(data.message || "Failed to update role");
        await fetchUsers();
      }
    } catch (e) {
      toast.error("Failed to update role");
      await fetchUsers();
    }
  };

  return (
    <div
      className="space-y-6 w-full mx-auto"
      // style={{
      //   maxWidth: "1440px",
      //   paddingLeft: "2.5rem",
      //   paddingRight: "2.5rem",
      // }}
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Monitor your platform's performance and user activity
          </p>
        </div>
      </div>

      {/* Stats Grid (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Users
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {kpi.totalUsers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Organizers
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {kpi.totalOrganizers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Events
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {kpi.totalEvents}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-slate-800">
                ${kpi.totalRevenue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* All Events List */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            All Events
          </h2>
          <div className="w-full overflow-x-auto">
            <table className="w-full table-auto text-sm border border-slate-200 rounded-lg overflow-hidden min-w-max">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">
                    Event Name
                  </th>
                  <th className="text-left py-2 px-3 font-semibold">Date</th>
                  <th className="text-left py-2 px-3 font-semibold">Time</th>
                  <th className="text-left py-2 px-3 font-semibold">
                    Ticket Price
                  </th>
                  <th className="text-left py-2 px-3 font-semibold">
                    Sold/Available
                  </th>
                  <th className="text-left py-2 px-3 font-semibold">Revenue</th>
                  <th className="text-left py-2 px-3 font-semibold">
                    Organizer Name
                  </th>
                  <th className="text-left py-2 px-3 font-semibold">
                    Organizer Email
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-slate-400 py-4 text-center">
                      No events found
                    </td>
                  </tr>
                ) : (
                  events.map((ev, idx) => (
                    <tr
                      key={ev._id}
                      className={
                        (idx % 2 === 0 ? "bg-white" : "bg-slate-50") +
                        " hover:bg-blue-50 transition-colors border-b border-slate-200 last:border-b-0"
                      }
                    >
                      <td className="py-2 px-3 whitespace-nowrap">{ev.name}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {ev.date ? new Date(ev.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {ev.time ? formatTimeTo12Hour(ev.time) : "-"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-medium">
                          ${ev.ticketPrice || 0}
                        </div>
                        {ev.dynamicPricing?.enabled && (
                          <div className="text-xs text-slate-500">
                            Dynamic pricing
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {ev.soldTickets || 0}/{ev.totalSeats || 0}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-medium">
                        ${(ev.revenue || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {ev.organizer?.name || ev.createdBy?.name || "-"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {ev.organizer?.email || ev.createdBy?.email || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              className="w-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 py-2 px-4 rounded-xl border border-blue-200 shadow-sm font-semibold text-base hover:from-blue-200 hover:to-blue-300 hover:shadow-md transition-all duration-150"
              onClick={() => setShowAddModal(true)}
            >
              Manage Users
            </button>
            <button className="w-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 py-2 px-4 rounded-xl border border-blue-200 shadow-sm font-semibold text-base hover:from-blue-200 hover:to-blue-300 hover:shadow-md transition-all duration-150">
              Approve Events
            </button>
            <button className="w-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 py-2 px-4 rounded-xl border border-blue-200 shadow-sm font-semibold text-base hover:from-blue-200 hover:to-blue-300 hover:shadow-md transition-all duration-150">
              Generate Reports
            </button>
            <button className="w-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 py-2 px-4 rounded-xl border border-blue-100 shadow-sm font-semibold text-base hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all duration-150">
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* Manage Users Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-200 bg-opacity-20">
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-6xl"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  Manage Users
                </h2>
                <button
                  className="text-slate-500 hover:text-slate-800 text-2xl font-bold"
                  onClick={() => setShowAddModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex justify-end mb-2">
                  <button
                    className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border flex items-center gap-2"
                    onClick={async () => {
                      setRefreshStatus("loading");
                      await fetchUsers();
                      setRefreshStatus("done");
                      setTimeout(() => setRefreshStatus(""), 1500);
                    }}
                    disabled={refreshStatus === "loading"}
                  >
                    {refreshStatus === "loading" && (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                    )}
                    {refreshStatus === "loading" ? "Loading..." : "Refresh"}
                  </button>
                </div>
                {["admin", "organizer", "user"].map((role) => (
                  <div key={role} className="border rounded-lg mb-1">
                    <button
                      className={`w-full text-left px-4 py-2 flex items-center justify-between rounded-t-lg transition-colors duration-150 ${
                        openRoles.includes(role)
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-50 text-slate-700 hover:bg-blue-100"
                      }`}
                      onClick={() =>
                        setOpenRoles((prev) =>
                          prev.includes(role)
                            ? prev.filter((r) => r !== role)
                            : [...prev, role]
                        )
                      }
                      style={{
                        fontWeight: 500,
                        fontSize: "1rem",
                        letterSpacing: 0.2,
                      }}
                    >
                      <span className="capitalize flex items-center">
                        <span
                          className={`mr-2 transition-transform duration-200 ${
                            openRoles.includes(role) ? "rotate-90" : ""
                          }`}
                          style={{
                            fontSize: "0.85em",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#94a3b8",
                          }}
                        >
                          ▶
                        </span>
                        {role}s
                      </span>
                    </button>
                    {openRoles.includes(role) && (
                      <div className="overflow-x-auto px-4 pb-2">
                        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold">
                                Name
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Email
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Verified
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Joined
                              </th>
                              <th className="text-left py-2 px-3 font-semibold">
                                Role
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {users[role]?.length > 0 &&
                              users[role].map((u, idx) => (
                                <tr
                                  key={u._id || u.email}
                                  className={
                                    (idx % 2 === 0
                                      ? "bg-white"
                                      : "bg-slate-50") +
                                    " hover:bg-blue-50 transition-colors border-b border-slate-200 last:border-b-0"
                                  }
                                >
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.name}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.email}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.verified ? "Yes" : "No"}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    {u.createdAt
                                      ? new Date(
                                          u.createdAt
                                        ).toLocaleDateString()
                                      : "-"}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap">
                                    <select
                                      value={u.role}
                                      onChange={(e) =>
                                        handleRoleChange(
                                          u.email,
                                          e.target.value
                                        )
                                      }
                                      className="border rounded px-2 py-1 text-xs"
                                    >
                                      <option value="admin">Admin</option>
                                      <option value="organizer">
                                        Organizer
                                      </option>
                                      <option value="user">User</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4 text-slate-700">
                  Add User, Organizer or Admin
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border rounded px-3 py-2"
                      value={addForm.email}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full border rounded px-3 py-2"
                      value={addForm.phoneNumber}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={addForm.role}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, role: e.target.value }))
                      }
                      required
                    >
                      <option value="organizer">Organizer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-slate-200 text-slate-700"
                      onClick={() => setShowAddModal(false)}
                      disabled={addLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                      disabled={addLoading}
                    >
                      {addLoading ? "Adding..." : "Add User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

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

export default AdminDashboard;
