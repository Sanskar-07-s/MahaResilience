import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import {
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  Landmark,
  HeartPulse,
  Bell,
  Droplets,
  Zap,
  Trash2,
  Wheat,
  GraduationCap,
  Bus,
  Compass,
  Users,
  FileText,
  Bot,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Menu,
} from 'lucide-react';

interface SidebarProps {
  onOpenAIAssistant: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAIAssistant,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, isAuthenticated, logout, isSuperAdmin, canAccessAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  interface NavItem {
    label: string;
    path: string;
    icon: any;
    highlight?: boolean;
    admin?: boolean;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'CORE PLATFORM',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Resiliency Map', path: '/map', icon: MapPin },
        { label: 'Emergency SOS', path: '/emergency', icon: ShieldAlert, highlight: true },
        { label: 'Disaster Alerts', path: '/alerts', icon: Bell },
      ],
    },
    {
      title: 'CIVIC & PUBLIC SERVICES',
      items: [
        { label: 'Government Seva', path: '/government', icon: Landmark },
        { label: 'Healthcare Beds', path: '/healthcare', icon: HeartPulse },
        { label: 'Water Utilities', path: '/water', icon: Droplets },
        { label: 'Electricity Grid', path: '/electricity', icon: Zap },
        { label: 'Sanitation & Waste', path: '/waste', icon: Trash2 },
      ],
    },
    {
      title: 'COMMUNITY & REGIONAL',
      items: [
        { label: 'Agriculture & APMC', path: '/agriculture', icon: Wheat },
        { label: 'Education & ITI', path: '/education', icon: GraduationCap },
        { label: 'Transit & EV Hubs', path: '/transport', icon: Bus },
        { label: 'Tourism & Heritage', path: '/tourism', icon: Compass },
        { label: 'Community Hub', path: '/community', icon: Users },
        { label: 'File Complaint', path: '/complaints', icon: FileText },
      ],
    },
  ];

  navGroups.push({
    title: 'COMMAND CENTER',
    items: [{ label: 'Admin Command Center', path: '/admin', icon: ShieldCheck, admin: true }],
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-600 to-sky-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
            MR
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-extrabold text-white text-base tracking-tight leading-none">
                MahaResilience
              </h1>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mt-1">
                Maharashtra Gov Hub
              </span>
            </div>
          )}
        </div>

        {/* Collapse button for desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close button for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* AI Assistant Quick Trigger Card */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => {
            onOpenAIAssistant();
            if (mobileOpen) setMobileOpen(false);
          }}
          className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
            collapsed ? 'px-0' : ''
          }`}
          title="Launch AI Community Assistant"
        >
          <Bot className="w-4 h-4 shrink-0 animate-bounce" />
          {!collapsed && <span>Ask AI Assistant</span>}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-wider px-2 pt-2">
                {group.title}
              </h2>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    } ${item.highlight ? 'text-red-400 hover:text-red-300' : ''}`
                  }
                  title={item.label}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      item.highlight ? 'text-red-500' : ''
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div className="truncate text-xs">
                  <div className="font-bold text-slate-200 truncate">{user.name}</div>
                  <div className="text-[10px] text-teal-400 font-mono uppercase">{user.role}</div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          !collapsed && (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Sign In
            </button>
          )
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
