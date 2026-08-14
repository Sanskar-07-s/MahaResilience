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

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { soundEnabled, toggleAlertSounds } = useAlert();
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl py-2 z-50 border border-slate-200 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                    <span>Regional Bulletins</span>
                    <span
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-teal-600 cursor-pointer hover:underline"
                    >
                      Close
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <p className="text-[10px] text-red-600 font-black uppercase">CRITICAL WEATHER</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">Heavy Rain & High Tide Watch</p>
                      <p className="text-[10px] text-slate-400 mt-1">10 minutes ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Badge / Admin Status */}
            {isAuthenticated && user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-800 truncate max-w-[120px]">{user.name}</div>
                  {isSuperAdmin(user) ? (
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                      Super Admin
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 uppercase">{user.role}</span>
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
              <span className="font-bold text-slate-700">MahaResilience CommunityHUB</span>
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
