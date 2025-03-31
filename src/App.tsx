import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Index from "@/pages/Index";
import Food from "@/pages/Food";
import FoodDetails from "@/pages/FoodDetails";
import Stays from "@/pages/Stays";
import StayDetails from "@/pages/StayDetails";
import BecomeHost from "@/pages/BecomeHost";
import HostFood from "@/pages/host/HostFood";
import HostStay from "@/pages/host/HostStay";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthCallback from "@/pages/auth/Callback";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Help from "@/pages/Help";
import Safety from "@/pages/Safety";
import HostDashboard from "@/pages/host/HostDashboard";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { useEffect } from "react";
import Profile from "@/pages/Profile";
import { Toaster } from "sonner";
import BookingConfirmation from "@/pages/BookingConfirmation";
import UserBookings from "@/pages/UserBookings";

const HostRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !user.is_host)) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user && user.is_host ? <>{children}</> : null;
};

// This component will refresh user data at startup only if cache is stale or missing
const UserSync = () => {
  const { refreshUser, user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    // On initial app load, we need to carefully manage profile refresh to avoid session loss
    // Only refresh user data if we don't have it cached or if it's stale
    const lastCheck = user?.lastProfileCheck || 0;
    const now = Date.now();
    const CACHE_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    
    const shouldRefresh = !isAuthenticated || !user || (now - lastCheck) > CACHE_REFRESH_THRESHOLD;
    
    if (shouldRefresh) {
      console.log('Refreshing user data on app startup');
      setTimeout(() => {
        // Small delay to ensure auth state is stable before refreshing
        refreshUser();
      }, 500);
    } else {
      console.log('Using cached user data on app startup');
    }
  }, [refreshUser, user, isAuthenticated]);
  
  return null;
};

const App = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <ScrollToTop />
          <UserSync />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/food" element={<Food />} />
            <Route path="/foods/:id" element={<FoodDetails />} />
            <Route path="/food/:id" element={<FoodDetails />} />
            <Route path="/stays" element={<Stays />} />
            <Route path="/stays/:id" element={<StayDetails />} />
            <Route path="/become-host" element={<BecomeHost />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/help" element={<Help />} />
            <Route path="/safety" element={<Safety />} />

            {/* Booking Routes */}
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <UserBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/dashboard"
              element={
                <ProtectedRoute>
                  <HostRoute>
                    <HostDashboard />
                  </HostRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/food"
              element={
                <ProtectedRoute>
                  <HostFood />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/food/:id"
              element={
                <ProtectedRoute>
                  <HostFood />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/food/new"
              element={
                <ProtectedRoute>
                  <HostFood />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/food/edit/:id"
              element={
                <ProtectedRoute>
                  <HostFood />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/stay"
              element={
                <ProtectedRoute>
                  <HostStay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/stay/:id"
              element={
                <ProtectedRoute>
                  <HostStay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/stay/new"
              element={
                <ProtectedRoute>
                  <HostStay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <Toaster position="top-center" />
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;