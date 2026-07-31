import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext.tsx';
import { AlertProvider } from '../contexts/AlertContext.tsx';
import { NotificationProvider } from '../contexts/NotificationContext.tsx';
import { seedOfflineDatabase } from '../utils/db.ts';

// Layouts
import MainLayout from '../layouts/MainLayout.tsx';

// Pages
import LandingPage from '../pages/Landing/LandingPage.tsx';
import LoginPage from '../pages/Login/LoginPage.tsx';
import RegisterPage from '../pages/Register/RegisterPage.tsx';
import DashboardPage from '../pages/Dashboard/DashboardPage.tsx';
import EmergencyPage from '../pages/Emergency/EmergencyPage.tsx';
import GovernmentPage from '../pages/Government/GovernmentPage.tsx';
import HealthcarePage from '../pages/Healthcare/HealthcarePage.tsx';
import AlertsPage from '../pages/Alerts/AlertsPage.tsx';
import ComplaintsPage from '../pages/Complaints/ComplaintsPage.tsx';
import TourismPage from '../pages/Tourism/TourismPage.tsx';
import TransportPage from '../pages/Transport/TransportPage.tsx';
import CommunityPage from '../pages/Community/CommunityPage.tsx';
import MapPage from '../pages/Map/MapPage.tsx';
import AdminDashboardPage from '../pages/Admin/AdminDashboardPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  React.useEffect(() => {
    seedOfflineDatabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlertProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Standard and Civic routes wrapped in MainLayout */}
                <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <MainLayout><DashboardPage /></MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/emergency" element={<MainLayout><EmergencyPage /></MainLayout>} />
                <Route path="/government" element={<MainLayout><GovernmentPage /></MainLayout>} />
                <Route path="/healthcare" element={<MainLayout><HealthcarePage /></MainLayout>} />
                <Route path="/alerts" element={<MainLayout><AlertsPage /></MainLayout>} />
                <Route path="/complaints" element={<MainLayout><ComplaintsPage /></MainLayout>} />
                <Route path="/tourism" element={<MainLayout><TourismPage /></MainLayout>} />
                <Route path="/transport" element={<MainLayout><TransportPage /></MainLayout>} />
                <Route path="/community" element={<MainLayout><CommunityPage /></MainLayout>} />
                <Route path="/map" element={<MainLayout><MapPage /></MainLayout>} />

                {/* Admin only dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'OFFICIAL']}>
                      <MainLayout><AdminDashboardPage /></MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </NotificationProvider>
        </AlertProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
