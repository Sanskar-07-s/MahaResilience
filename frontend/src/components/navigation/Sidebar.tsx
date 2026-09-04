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

  const roleUpper = (user?.role || 'CITIZEN').toUpperCase();
  const isUserSuperAdmin = isSuperAdmin();
  const hasAdminAccess = canAccessAdmin();

  // ─── Build Distinct Navbars Based On Exact User Role ─────────────────────────
  let navGroups: NavGroup[] = [];
  let roleBadgeLabel = 'Citizen Resident';
  let roleBadgeColor = 'text-teal-400 bg-teal-950/60 border-teal-500/30';

  if (isUserSuperAdmin || roleUpper === 'SUPER_ADMIN' || roleUpper === 'ADMIN') {
    // 1. SUPER ADMIN NAVBAR
    roleBadgeLabel = '👑 Super Admin Control';
    roleBadgeColor = 'text-yellow-400 bg-yellow-950/60 border-yellow-500/40';
    navGroups = [
      {
        title: 'MASTER COMMAND CENTER',
        items: [
          { label: '📊 Platform Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: '👑 Master Control Hub', path: '/admin?field=SUPER', icon: ShieldCheck, admin: true },
          { label: 'Platform Map & GIS', path: '/map', icon: MapPin },
          { label: 'Disaster Alerts Studio', path: '/alerts', icon: Bell },
        ],
      },
      {
        title: 'CIVIC & OPERATIONAL MODULES',
        items: [
          { label: 'Government Seva', path: '/government', icon: Landmark },
          { label: 'Healthcare & ICU Beds', path: '/healthcare', icon: HeartPulse },
          { label: 'Water Utilities', path: '/water', icon: Droplets },
          { label: 'Electricity Grid', path: '/electricity', icon: Zap },
          { label: 'Sanitation & SWM', path: '/waste', icon: Trash2 },
          { label: 'Agriculture & APMC', path: '/agriculture', icon: Wheat },
          { label: 'Education Services', path: '/education', icon: GraduationCap },
          { label: 'Transit & Charging', path: '/transport', icon: Bus },
          { label: 'Tourism Moderation', path: '/tourism', icon: Compass },
          { label: 'Community Feed', path: '/community', icon: Users },
          { label: 'Citizen Grievances', path: '/complaints', icon: FileText },
        ],
      },
    ];
  } else if (roleUpper === 'DISTRICT_ADMIN') {
    // 2. DISTRICT ADMIN NAVBAR
    roleBadgeLabel = '📍 District Collectorate';
    roleBadgeColor = 'text-amber-400 bg-amber-950/60 border-amber-500/40';
    navGroups = [
      {
        title: 'DISTRICT OPERATIONS',
        items: [
          { label: '📊 District Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: '📍 District Admin Console', path: '/admin?field=DISTRICT', icon: ShieldCheck, admin: true },
          { label: 'District Resiliency Map', path: '/map', icon: MapPin },
          { label: 'Disaster Bulletins', path: '/alerts', icon: Bell },
          { label: 'Collectorate Grievances', path: '/complaints', icon: FileText },
        ],
      },
      {
        title: 'DISTRICT PUBLIC UTILITIES',
        items: [
          { label: 'Government Seva', path: '/government', icon: Landmark },
          { label: 'Healthcare & Beds', path: '/healthcare', icon: HeartPulse },
          { label: 'Water Supply Tankers', path: '/water', icon: Droplets },
          { label: 'Electricity Grid', path: '/electricity', icon: Zap },
          { label: 'Sanitation & Waste', path: '/waste', icon: Trash2 },
        ],
      },
    ];
  } else if (hasAdminAccess && user) {
    // 3. SPECIALIZED MODULE ADMIN NAVBAR
    let targetField = (user.adminField || '').toUpperCase();
    if (!targetField && roleUpper.endsWith('_ADMIN')) {
      targetField = roleUpper.replace('_ADMIN', '');
    } else if (!targetField && (roleUpper.endsWith('_MODERATOR') || roleUpper === 'MODERATOR')) {
      targetField = 'COMMUNITY';
    }

    const fieldConfig: Record<string, { label: string; path: string; icon: any }> = {
      AGRICULTURE: { label: '🌱 APMC Agriculture Console', path: '/agriculture', icon: Wheat },
      HEALTHCARE: { label: '❤️ Healthcare Admin Console', path: '/healthcare', icon: HeartPulse },
      EMERGENCY: { label: '🚨 Disaster EOC Console', path: '/emergency', icon: ShieldAlert },
      WATER: { label: '💧 Water Supply Console', path: '/water', icon: Droplets },
      ELECTRICITY: { label: '⚡ Electricity Grid Console', path: '/electricity', icon: Zap },
      WASTE: { label: '♻️ Sanitation & Waste Console', path: '/waste', icon: Trash2 },
      EDUCATION: { label: '🎓 Education Admin Console', path: '/education', icon: GraduationCap },
      TRANSPORT: { label: '🚌 Transport Admin Console', path: '/transport', icon: Bus },
      GOVERNMENT: { label: '🏛️ Welfare Schemes Console', path: '/government', icon: Landmark },
      TOURISM: { label: '🧭 Tourism Admin Console', path: '/tourism', icon: Compass },
      COMPLAINTS: { label: '📋 Grievances Admin Console', path: '/complaints', icon: FileText },
      COMMUNITY: { label: '💬 Community Moderator Console', path: '/community', icon: Users },
    };

    const currentModule = fieldConfig[targetField] || {
      label: `🛡️ ${targetField} Operational Console`,
      path: '/dashboard',
      icon: ShieldCheck,
    };

    roleBadgeLabel = `🛡️ ${targetField} Admin`;
    roleBadgeColor = 'text-teal-300 bg-teal-950/60 border-teal-500/40';

    navGroups = [
      {
        title: 'ASSIGNED OPERATIONAL CONSOLE',
        items: [
          { label: '📊 Operations Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: currentModule.label, path: `/admin?field=${targetField}`, icon: ShieldCheck, admin: true },
          { label: 'Module Public View', path: currentModule.path, icon: currentModule.icon },
        ],
      },
      {
        title: 'OPERATIONAL SUPPORT TOOLS',
        items: [
          { label: 'GIS Resiliency Map', path: '/map', icon: MapPin },
          { label: 'Emergency Alerts', path: '/alerts', icon: Bell },
          { label: 'Civic Grievances', path: '/complaints', icon: FileText },
        ],
      },
    ];
  } else if (roleUpper === 'VOLUNTEER') {
    // 4. VOLUNTEER NAVBAR
    roleBadgeLabel = '🤝 Civil Defense Volunteer';
    roleBadgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    navGroups = [
      {
        title: 'VOLUNTEER OPERATIONS',
        items: [
          { label: 'Volunteer Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Disaster SOS Response', path: '/emergency', icon: ShieldAlert, highlight: true },
          { label: 'Disaster Alerts Feed', path: '/alerts', icon: Bell },
          { label: 'Community Volunteer Drives', path: '/community', icon: Users },
          { label: 'GIS Operations Map', path: '/map', icon: MapPin },
        ],
      },
      {
        title: 'COMMUNITY ASSISTANCE',
        items: [
          { label: 'Healthcare & Blood Banks', path: '/healthcare', icon: HeartPulse },
          { label: 'Sanitation Support', path: '/waste', icon: Trash2 },
          { label: 'Assist Grievances', path: '/complaints', icon: FileText },
        ],
      },
    ];
  } else if (roleUpper === 'OFFICIAL') {
    // 5. OFFICIAL NAVBAR
    roleBadgeLabel = '🏛️ Municipal Official';
    roleBadgeColor = 'text-sky-400 bg-sky-950/60 border-sky-500/30';
    navGroups = [
      {
        title: 'OFFICIAL DESK',
        items: [
          { label: 'Officer Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Complaints & Grievances Desk', path: '/complaints', icon: FileText },
          { label: 'Disaster Alerts Dispatch', path: '/alerts', icon: Bell },
          { label: 'GIS Map Operations', path: '/map', icon: MapPin },
        ],
      },
      {
        title: 'PUBLIC SERVICES',
        items: [
          { label: 'Welfare Schemes Review', path: '/government', icon: Landmark },
          { label: 'Healthcare & Bed Availabilities', path: '/healthcare', icon: HeartPulse },
          { label: 'Water Utilities', path: '/water', icon: Droplets },
          { label: 'Electricity Grid', path: '/electricity', icon: Zap },
          { label: 'Sanitation & Waste', path: '/waste', icon: Trash2 },
        ],
      },
    ];
  } else {
    // 6. CITIZEN / TOURIST / GENERAL PUBLIC NAVBAR (ZERO ADMIN LINKS)
    roleBadgeLabel = roleUpper === 'TOURIST' ? '🧭 Tourist Visitor' : 'Citizen Resident';
    roleBadgeColor = 'text-teal-400 bg-teal-950/60 border-teal-500/30';
    navGroups = [
      {
        title: 'PUBLIC CIVIC SERVICES',
        items: [
          { label: 'Citizen Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Live Resiliency Map', path: '/map', icon: MapPin },
          { label: 'Emergency SOS', path: '/emergency', icon: ShieldAlert, highlight: true },
          { label: 'Disaster Alerts Feed', path: '/alerts', icon: Bell },
        ],
      },
      {
        title: 'GOVERNMENT & PUBLIC UTILITIES',
        items: [
          { label: 'Government Welfare Schemes', path: '/government', icon: Landmark },
          { label: 'Healthcare & ICU Beds', path: '/healthcare', icon: HeartPulse },
          { label: 'Water Supply & Tankers', path: '/water', icon: Droplets },
          { label: 'Electricity Grid Status', path: '/electricity', icon: Zap },
          { label: 'Sanitation & Waste Pickup', path: '/waste', icon: Trash2 },
        ],
      },
      {
        title: 'COMMUNITY & REGIONAL LIVING',
        items: [
          { label: 'Agriculture & APMC Mandi', path: '/agriculture', icon: Wheat },
          { label: 'Education & Admissions', path: '/education', icon: GraduationCap },
          { label: 'Transit & EV Charging', path: '/transport', icon: Bus },
          { label: 'Tourism & Heritage Places', path: '/tourism', icon: Compass },
          { label: 'Community Discussion Hub', path: '/community', icon: Users },
          { label: 'File Complaint / Grievance', path: '/complaints', icon: FileText },
        ],
      },
    ];
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
          title="Go to Platform Dashboard"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-600 to-sky-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
            MR
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-extrabold text-white text-base tracking-tight leading-none">
                MahaResilience
              </h1>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mt-1 px-1.5 py-0.5 rounded border ${roleBadgeColor} truncate`}>
                {roleBadgeLabel}
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
