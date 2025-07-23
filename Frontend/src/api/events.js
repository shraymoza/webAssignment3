import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

let cachedEvents = null;
let cachedEventById = {};

export const fetchEvents = async () => {
  if (cachedEvents) return cachedEvents;
  const res = await axios.get(`${API_URL}/api/events`, {
    headers: getAuthHeader(),
  });
  cachedEvents = res.data.data.events;
  return cachedEvents;
};

export const fetchEvent = async (id) => {
  if (cachedEventById[id]) return cachedEventById[id];
  const res = await axios.get(`${API_URL}/api/events/${id}`, {
    headers: getAuthHeader(),
  });
  cachedEventById[id] = res.data.data.event;
  return cachedEventById[id];
};

export const fetchEventById = async (id) => {
  return fetchEvent(id); // use the cached function
};

export const createEvent = async (eventData) => {
  let hasFile = eventData.image && eventData.image instanceof File;
  let payload, headers;
  if (hasFile) {
    payload = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (key === "image" && value) {
        payload.append("image", value);
      } else {
        payload.append(key, value);
      }
    });
    headers = { ...getAuthHeader() };
  } else {
    payload = eventData;
    headers = { ...getAuthHeader(), "Content-Type": "application/json" };
  }
  const res = await axios.post(`${API_URL}/api/events`, payload, {
    headers,
  });
  cachedEvents = null; // invalidate cache
  return res.data.data.event;
};

export const updateEvent = async (id, eventData) => {
  let hasFile = eventData.image && eventData.image instanceof File;
  let payload, headers;
  if (hasFile) {
    payload = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (key === "image" && value) {
        payload.append("image", value);
      } else {
        payload.append(key, value);
      }
    });
    headers = { ...getAuthHeader() };
  } else {
    payload = eventData;
    headers = { ...getAuthHeader(), "Content-Type": "application/json" };
  }
  const res = await axios.put(`${API_URL}/api/events/${id}`, payload, {
    headers,
  });
  cachedEvents = null;
  cachedEventById[id] = res.data.data.event;
  return cachedEventById[id];
};

export const deleteEvent = async (id) => {
  const res = await axios.delete(`${API_URL}/api/events/${id}`, {
    headers: getAuthHeader(),
  });
  cachedEvents = null;
  delete cachedEventById[id];
  return res.data;
};
