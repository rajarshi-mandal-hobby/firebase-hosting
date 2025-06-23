import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container, Loader, Stack, Text } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import SignIn from "../pages/SignIn";
import Dashboard from "./Dashboard";
import AdminDashboard from "./admin/core/AdminDashboard";
import PhoneVerification from "./PhoneVerification";

const LoadingScreen: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => (
  <Container
    size="sm"
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Stack align="center" gap="md">
      <Loader size="xl" type="dots" />
      <Text c="dimmed" size="sm">
        {message}
      </Text>
    </Stack>
  </Container>
);

const AppRouter: React.FC = () => {
  const { user, userProfile, loading, profileLoading, authInitialized } =
    useAuth();
  // Development mode bypass for testing (set VITE_DEV_BYPASS_AUTH=true in .env)
  const devBypassAuth = import.meta.env["VITE_DEV_BYPASS_AUTH"] === "true";

  if (devBypassAuth) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    );
  }

  // Show loading screen until auth is initialized
  if (!authInitialized) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  // Show loading screen during auth operations
  if (loading) {
    return <LoadingScreen message="Signing you in..." />;
  }

  // If user is not authenticated, show sign-in page
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<SignIn />} />
        </Routes>
      </Router>
    );
  }

  // If user is authenticated but profile is still loading, show loading
  if (profileLoading || !userProfile) {
    return <LoadingScreen message="Loading your profile..." />;
  }
  // If user is admin or phone verified, show dashboard
  if (userProfile.isAdmin || userProfile.phoneVerified) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={userProfile.isAdmin ? <AdminDashboard /> : <Dashboard />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    );
  }

  // If regular user needs phone verification
  return (
    <Router>
      <Routes>
        <Route path="*" element={<PhoneVerification />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
