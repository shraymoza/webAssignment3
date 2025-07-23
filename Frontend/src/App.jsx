import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./components/LandingPage";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "./components/Loader";

//  Lazy-loaded pages
const EventDetails = lazy(() => import("./pages/EventDetails"));
const Booking = lazy(() => import("./pages/Booking"));
const Payment = lazy(() => import("./pages/Payment"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for JWT and fetch user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data.data.user);
          setLoading(false);
        })
        .catch(() => {
          setUser(null);
          setLoading(false);
        });
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <BrowserRouter>
                <Suspense fallback={<Loader />}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                user ? (
                                    <LandingPage
                                        userRole={user.role}
                                        userName={user.name}
                                        user={user}
                                        onLogout={handleLogout}
                                    />
                                ) : (
                                    <Login setUser={setUser} />
                                )
                            }
                        />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login setUser={setUser} />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route
                            path="/dashboard"
                            element={
                                user ? (
                                    <LandingPage
                                        userRole={user.role}
                                        userName={user.name}
                                        user={user}
                                        onLogout={handleLogout}
                                    />
                                ) : (
                                    <Login setUser={setUser} />
                                )
                            }
                        />
                        <Route
                            path="/event/:eventId"
                            element={user ? <EventDetails /> : <Login setUser={setUser} />}
                        />
                        <Route
                            path="/booking/:eventId"
                            element={user ? <Booking /> : <Login setUser={setUser} />}
                        />
                        <Route
                            path="/payment/:bookingId"
                            element={user ? <Payment /> : <Login setUser={setUser} />}
                        />
                        <Route
                            path="/booking-confirmation/:bookingId"
                            element={
                                user ? (
                                    <BookingConfirmation user={user} />
                                ) : (
                                    <Login setUser={setUser} />
                                )
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                user ? (
                                    <ProfilePage user={user} setUser={setUser} />
                                ) : (
                                    <Login setUser={setUser} />
                                )
                            }
                        />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </>
    );
}

function AuthHome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-2">
            <span className="text-white font-bold text-lg">ES</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Welcome to EventSpark
          </h1>
          <p className="text-slate-600">
            Book, organize, and manage events with ease.
          </p>
        </div>
        <div className="flex flex-col space-y-3">
          <a
            href="/login"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
