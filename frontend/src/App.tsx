import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AdminAccess from "./pages/AdminAccess";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AlarmListPage from "./pages/Alarms/AlarmList";
import { useEffect } from 'react';
import api from './services/api';
import AlarmDetails from "./pages/Alarms/AlarmDetails";

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
  useEffect(() => {
    // Fetch CSRF token by making a GET request to Django
    api.get('/api/alarms/').catch(error => {
      console.error('Error fetching initial data:', error);
    });
  }, []);

  return (
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
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
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/alarms" element={<AlarmListPage />} />
            <Route path="/alarms/:id" element={<AlarmDetails />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
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
  );
}
