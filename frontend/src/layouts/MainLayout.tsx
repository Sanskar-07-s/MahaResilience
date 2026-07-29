import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  Menu,
  X,
  AlertTriangle,
  User,
  LogOut,
  Building,
  Bell,
  Home,
  Shield,
  HeartPulse,
  Flame,
  FileText,
  Map,
  Compass,
  Bus,
  Users
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const activeLink = (path: string) => location.pathname === path;

  const handleSOS = async () => {
    // Direct link to emergency page or trigger API call if coordinates exist
    navigate('/emergency');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: Shield, authRequired: true },
    { name: 'Emergency SOS', path: '/emergency', icon: Flame, highlight: true },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Complaints', path: '/complaints', icon: FileText },
    { name: 'Map Info', path: '/map', icon: Map },
    { name: 'Maha Schemes', path: '/government', icon: Building },
    { name: 'Healthcare', path: '/healthcare', icon: HeartPulse },
    { name: 'Tourism', path: '/tourism', icon: Compass },
    { name: 'Transport', path: '/transport', icon: Bus },
    { name: 'Community', path: '/community', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-background">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md3 bg-primary flex items-center justify-center text-white shadow-md">
                  <span className="font-bold text-lg">CH</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">
                  Community<span className="text-primary">HUB</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks
                .filter((link) => !link.authRequired || isAuthenticated)
                .slice(0, 7) // Limit links in top nav for design space
                .map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md3 text-sm font-medium transition-all duration-200 ${
                      link.highlight
                        ? 'bg-danger text-white hover:bg-danger-hover shadow-sm'
                        : activeLink(link.path)
                        ? 'bg-primary-light text-primary'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                ))}
            </div>

            {/* Right side controls */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={handleSOS}
                className="flex items-center gap-1.5 bg-danger text-white px-4 py-2 rounded-md3 font-semibold hover:bg-danger-hover shadow-md hover-scale"
              >
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                SOS
              </button>

              {/* Notification icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-white"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md3 shadow-md3-elevation-2 py-2 z-50 border border-slate-border">
                    <div className="px-4 py-2 border-b border-slate-border font-semibold text-slate-700 flex justify-between items-center">
                      <span>Recent Alerts</span>
                      <span className="text-xs text-primary font-normal cursor-pointer hover:underline">Mark read</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-border cursor-pointer">
                        <p className="text-xs text-danger font-semibold">CRITICAL ALERT</p>
                        <p className="text-sm font-medium text-slate-800">Severe Water Interruption in Pune-West</p>
                        <p className="text-xs text-slate-400 mt-1">10 minutes ago</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-border cursor-pointer">
                        <p className="text-xs text-warning font-semibold">WEATHER WARNING</p>
                        <p className="text-sm font-medium text-slate-800">Heavy Rainfall warnings for Mumbai suburbs</p>
                        <p className="text-xs text-slate-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                    <div className="text-center py-2 border-t border-slate-border">
                      <Link to="/alerts" onClick={() => setShowNotifications(false)} className="text-xs text-primary font-medium hover:underline">
                        See All Local Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Authentication profile link */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                  {user.role === 'ADMIN' || user.role === 'OFFICIAL' ? (
                    <Link
                      to="/admin"
                      className="p-2 text-primary hover:bg-primary-light rounded-full transition-colors"
                      title="Admin Panel"
                    >
                      <User className="w-5 h-5" />
                    </Link>
                  ) : null}
                  <button
                    onClick={logout}
                    className="p-2 text-slate-600 hover:text-danger hover:bg-danger-light rounded-full transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary text-white px-4 py-2 rounded-md3 text-sm font-semibold hover:bg-primary-hover shadow-sm transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden gap-3">
              <button
                onClick={handleSOS}
                className="bg-danger text-white px-3 py-1.5 rounded-md3 text-sm font-bold flex items-center gap-1 shadow-sm"
              >
                SOS
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md3 text-slate-600 hover:bg-slate-100 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-border bg-white py-2 px-4 shadow-inner">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md3 text-base font-medium ${
                    link.highlight
                      ? 'bg-danger text-white'
                      : activeLink(link.path)
                      ? 'bg-primary-light text-primary'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}

              {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'OFFICIAL') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md3 text-base font-medium text-slate-600 hover:bg-slate-50"
                >
                  <User className="w-5 h-5" />
                  Admin Dashboard
                </Link>
              )}
            </div>

            <div className="border-t border-slate-border mt-4 pt-4 pb-2">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-danger bg-danger-light px-3 py-1.5 rounded-md3 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 border border-slate-border text-slate-600 rounded-md3 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 bg-primary text-white rounded-md3 text-sm font-semibold hover:bg-primary-hover"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-sm">
              CH
            </div>
            <span className="font-bold text-slate-700">CommunityHUB Maharashtra</span>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 Government of Maharashtra. Under Digital India & Civic-Tech Initiatives.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Helpline Contacts</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
