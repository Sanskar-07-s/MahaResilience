import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext.tsx';
import { LocationProvider } from '../contexts/LocationContext.tsx';
import { AlertProvider } from '../contexts/AlertContext.tsx';
import { NotificationProvider } from '../contexts/NotificationContext.tsx';
import { EmergencyModeProvider } from '../contexts/EmergencyModeContext.tsx';
import { seedOfflineDatabase } from '../utils/db.ts';
import { canAccessAdmin, isSuperAdmin } from '../utils/permissions.ts';

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
import { PlaceDetailsPage } from '../pages/Tourism/PlaceDetailsPage.tsx';
import TransportPage from '../pages/Transport/TransportPage.tsx';
import CommunityPage from '../pages/Community/CommunityPage.tsx';
import MapPage from '../pages/Map/MapPage.tsx';
import WaterPage from '../pages/Water/WaterPage.tsx';
import ElectricityPage from '../pages/Electricity/ElectricityPage.tsx';
import WastePage from '../pages/Waste/WastePage.tsx';
import AgriculturePage from '../pages/Agriculture/AgriculturePage.tsx';
import EducationPage from '../pages/Education/EducationPage.tsx';
import AdminDashboardPage from '../pages/Admin/AdminDashboardPage.tsx';
import ProfilePage from '../pages/Profile/ProfilePage.tsx';
import { AdminPlacesModerationPage } from '../pages/Admin/AdminPlacesModerationPage.tsx';

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

/** Admin route — auto-redirect Super Admin after login */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const App: React.FC = () => {
  React.useEffect(() => {
    seedOfflineDatabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <EmergencyModeProvider>
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
                    <Route path="/water" element={<MainLayout><WaterPage /></MainLayout>} />
                    <Route path="/electricity" element={<MainLayout><ElectricityPage /></MainLayout>} />
                    <Route path="/waste" element={<MainLayout><WastePage /></MainLayout>} />
                    <Route path="/agriculture" element={<MainLayout><AgriculturePage /></MainLayout>} />
                    <Route path="/education" element={<MainLayout><EducationPage /></MainLayout>} />
                    <Route path="/tourism" element={<MainLayout><TourismPage /></MainLayout>} />
                    <Route path="/tourism/place/:id" element={<MainLayout><PlaceDetailsPage /></MainLayout>} />
                    <Route path="/transport" element={<MainLayout><TransportPage /></MainLayout>} />
                    <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
                    <Route path="/community" element={<MainLayout><CommunityPage /></MainLayout>} />
                    <Route path="/map" element={<MainLayout><MapPage /></MainLayout>} />

                    {/* Admin Command Center — protected with AdminGuard inside the page */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <MainLayout><AdminDashboardPage /></MainLayout>
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/dashboard"
                      element={
                        <AdminRoute>
                          <MainLayout><AdminDashboardPage /></MainLayout>
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/tourism-moderation"
                      element={
                        <AdminRoute>
                          <MainLayout><AdminPlacesModerationPage /></MainLayout>
                        </AdminRoute>
                      }
                    />

                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </NotificationProvider>
            </AlertProvider>
          </EmergencyModeProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
