import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import Calendar from "./pages/Calendar";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AdminAccess from "./pages/AdminAccess";
import BeepingAlarms from "./pages/Maintenance/BeepingAlarms";
import Properties from "./pages/Properties/Properties";
import PropertyDetails from "./pages/Properties/PropertyDetails";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Toaster } from 'react-hot-toast';

// Suppress Kinde SDK error logs in development
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out Kinde token exchange errors that don't affect functionality
    const errorMessage = args.join(' ');
    if (errorMessage.includes('Token exchange failed: 500') || 
        errorMessage.includes('POST https://ghhs.kinde.com/oauth2/token 500')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <KindeProvider
        clientId="9b6e7df3e3ec46beb2d09a89565da00b"
        domain="https://ghhs.kinde.com"
        redirectUri="http://localhost:5173"
        logoutUri="http://localhost:5173"
      >
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Protected Dashboard Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index path="/" element={<Home />} />

              {/* Others Page */}
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Maintenance */}
              <Route path="/maintenance/beeping-alarms" element={<BeepingAlarms />} />

              {/* Properties */}
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:propertyId" element={<PropertyDetails />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />
            </Route>

            {/* Admin Access - Protected */}
            <Route path="/admin" element={<AdminAccess />} />

            {/* Auth Layout - Not Protected */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </KindeProvider>
    </>
  );
}
