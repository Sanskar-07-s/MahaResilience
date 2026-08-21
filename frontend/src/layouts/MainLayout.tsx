import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { isSuperAdmin, canAccessAdmin } from '../utils/permissions.ts';
import { AlertOverlay } from '../components/alerts/AlertOverlay.tsx';
import { OfflineBanner } from '../components/common/OfflineBanner.tsx';
import { LocationBar } from '../components/location/LocationBar.tsx';
import { Sidebar } from '../components/navigation/Sidebar.tsx';
import { AIAssistantDrawer } from '../components/ai/AIAssistantDrawer.tsx';
import { CriticalAlertBanner } from '../components/alerts/CriticalAlertBanner.tsx';
import {
  Menu,
  AlertTriangle,
  Bell,
  Volume2,
  VolumeX,
  Bot,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAlert } from '../contexts/AlertContext.tsx';
import { useSmartNotifications } from '../contexts/NotificationContext.tsx';

import { useEmergencyMode } from '../contexts/EmergencyModeContext.tsx';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isEmergencyMode, deactivateEmergencyMode } = useEmergencyMode();
  const { soundEnabled, toggleAlertSounds } = useAlert();
  const { notifications, unreadCount, markAsRead, clearAllNotifications } = useSmartNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSOS = () => {
    navigate('/emergency');
  };

  return (
    <div className="min-h-screen flex bg-slate-background">
      <AlertOverlay />
      <OfflineBanner />

      {/* Persistent Left Sidebar Navigation */}
      <Sidebar
        onOpenAIAssistant={() => setAiDrawerOpen(true)}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* AI Community Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all duration-300">
        {/* Statewide Emergency Mode Global Banner */}
        {isEmergencyMode && (
          <div className="bg-red-700 text-white px-4 py-3 shadow-lg flex items-center justify-between gap-4 border-b-2 border-red-900 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-yellow-400 text-red-900 rounded-full font-black text-xs">
                ⚡
              </div>
              <p className="text-xs sm:text-sm font-black tracking-wide">
                STATEWIDE EMERGENCY MODE ACTIVATED — All disaster management services, emergency SOS, and civil defense assets prioritized.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/emergency')}
                className="bg-yellow-400 text-red-950 hover:bg-yellow-300 text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-xs transition-all"
              >
                🚨 SOS Center
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || canAccessAdmin(user)) && (
                <button
                  onClick={deactivateEmergencyMode}
                  className="bg-red-900/80 hover:bg-red-950 text-red-100 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-red-500"
                >
                  Turn Off Mode
                </button>
              )}
            </div>
          </div>
        )}

        <CriticalAlertBanner />
        <LocationBar />

        {/* Top Control Bar for Mobile Toggle & Sound Controls */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-border shadow-xs px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Emergency Quick SOS Button */}
            <button
              onClick={handleSOS}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SOS EMERGENCY</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Sound Toggle Control */}
            <button
              onClick={toggleAlertSounds}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundEnabled ? 'Alert Sounds Active' : 'Enable Alert Sounds'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Sounds ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            {/* AI Assistant Launcher Button */}
            <button
              onClick={() => setAiDrawerOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Launch AI Community Assistant"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl py-2 z-50 border border-slate-200 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      Regional Bulletins
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black">
                          {unreadCount} new
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => clearAllNotifications()}
                          className="text-[10px] text-teal-600 cursor-pointer hover:underline"
                        >
                          Clear
                        </button>
                      )}
                      <span
                        onClick={() => setShowNotifications(false)}
                        className="text-[10px] text-slate-400 cursor-pointer hover:underline"
                      >
                        Close
                      </span>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">No notifications.</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`px-4 py-3 hover:bg-slate-50 cursor-pointer ${
                            !n.isRead ? 'bg-teal-50/40' : ''
                          }`}
                        >
                          <p className="text-[10px] text-red-600 font-black uppercase">{n.category}</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{n.title}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Link & Badge */}
            {isAuthenticated && user && (
              <div
                onClick={() => navigate('/profile')}
                className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                title="Edit Citizen Profile & Demographic Settings"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-800 truncate max-w-[120px]">{user.name}</div>
                  {isSuperAdmin(user) ? (
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                      Super Admin
                    </span>
                  ) : (
                    <span className="text-[10px] text-teal-700 font-semibold uppercase">Profile ⚙</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-border py-6 mt-12 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-teal-700 flex items-center justify-center text-white font-bold text-xs">
                MR
              </div>
              <span className="font-bold text-slate-700">MahaResilience</span>
            </div>
            <p className="text-[11px] text-slate-400">
              © 2026 Government of Maharashtra. Location-Aware Smart Resilience Portal.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
