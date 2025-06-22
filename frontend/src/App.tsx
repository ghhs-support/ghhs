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
import { useEffect, useState } from 'react';
import { setAuthToken } from './services/api';
import AlarmDetails from "./pages/Alarms/AlarmDetails";
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

// Determine the base URL based on the environment
const baseURL = import.meta.env.PROD 
  ? 'https://ghhs.fly.dev'
  : 'http://localhost:5173';

// Use React frontend app configuration - this is safe to expose in browser code
const KINDE_CONFIG = {
  domain: 'https://ghhs.kinde.com',
  clientId: '9b6e7df3e3ec46beb2d09a89565da00b'  // React frontend app client ID (no secret needed)
};

// Suppress Kinde SDK error logs in development
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out Kinde token exchange errors that don't affect functionality
    const errorMessage = args.join(' ');
    if (errorMessage.includes('Token exchange failed: 500') || 
        errorMessage.includes('POST https://ghhs.kinde.com/oauth2/token 500') ||
        errorMessage.includes('POST https://ghhs.kinde.com/oauth2/token 401')) {
      return;
    }
    originalError.apply(console, args);
  };
}

// AuthSetup component to handle authentication
function AuthSetup({ children }: { children: React.ReactNode }) {
  const { getToken, isLoading, isAuthenticated, user } = useKindeAuth();

  useEffect(() => {
    const handleAuth = async () => {
      if (isLoading) return;

      if (isAuthenticated && user) {
        try {
          const token = await getToken();
          if (token) {
            setAuthToken(token);
            console.log('Auth token set for user:', user.email);
          } else {
            console.warn('No token received despite being authenticated');
            setAuthToken(null);
          }
        } catch (error) {
          console.error('Error getting token:', error);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
    };

    handleAuth();
  }, [isAuthenticated, isLoading, getToken, user]);

  // Refresh token periodically to prevent expiration during long sessions
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const refreshInterval = setInterval(async () => {
      try {
        const token = await getToken();
        if (token) {
          setAuthToken(token);
          console.log('Token refreshed');
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isLoading, getToken]);

  return <>{children}</>;
}

export default function App() {
  const [kindeConfig, setKindeConfig] = useState(KINDE_CONFIG);

  useEffect(() => {
    // Try to fetch Kinde configuration from backend (for production)
    // In development, we'll use the hardcoded config
    if (import.meta.env.PROD) {
      fetch(`${baseURL}/api/kinde-config/`)
        .then(response => response.json())
        .then(data => {
          setKindeConfig(data);
        })
        .catch(error => {
          console.warn('Failed to fetch Kinde config from backend, using environment config:', error);
        });
    }
  }, []);

  return (
    <KindeProvider
      clientId={kindeConfig.clientId}
      domain={kindeConfig.domain}
      redirectUri={window.location.origin}
      logoutUri={window.location.origin}
      useInsecureForRefreshToken={import.meta.env.DEV}
    >
      <Router>
        <AuthSetup>
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
        </AuthSetup>
      </Router>
    </KindeProvider>
  );
}
