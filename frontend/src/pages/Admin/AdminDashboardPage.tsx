import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { SUPER_ADMIN_UID_LOCAL, isSuperAdmin } from '../../utils/permissions.ts';
import { UserRole, AdminField } from '../../types/user.ts';
import { Shield, ChevronDown, CheckCircle, RefreshCw } from 'lucide-react';

// Portals
import { SuperAdminPortal } from './portals/SuperAdminPortal.tsx';
import { TourismAdminPortal } from './portals/TourismAdminPortal.tsx';
import { EmergencyAdminPortal } from './portals/EmergencyAdminPortal.tsx';
import { HealthcareAdminPortal } from './portals/HealthcareAdminPortal.tsx';
import { WaterAdminPortal } from './portals/WaterAdminPortal.tsx';
import { ElectricityAdminPortal } from './portals/ElectricityAdminPortal.tsx';
import { WasteAdminPortal } from './portals/WasteAdminPortal.tsx';
import { AgricultureAdminPortal } from './portals/AgricultureAdminPortal.tsx';
import { EducationAdminPortal } from './portals/EducationAdminPortal.tsx';
import { TransportAdminPortal } from './portals/TransportAdminPortal.tsx';
import { GovernmentAdminPortal } from './portals/GovernmentAdminPortal.tsx';
import { ComplaintsAdminPortal } from './portals/ComplaintsAdminPortal.tsx';
import { CommunityModeratorPortal } from './portals/CommunityModeratorPortal.tsx';
import { DistrictAdminPortal } from './portals/DistrictAdminPortal.tsx';

const ROLE_PORTAL_OPTIONS = [
  { role: 'SUPER_ADMIN', field: 'SUPER', label: '👑 Super Admin (Master Control Center)', color: 'from-amber-600 to-yellow-600' },
  { role: 'DISTRICT_ADMIN', field: 'DISTRICT', label: '📍 District Admin (Collectorate Operations)', color: 'from-amber-800 to-orange-900' },
  { role: 'EDUCATION_ADMIN', field: 'EDUCATION', label: '🎓 Education Admin (Schools, Colleges & Admissions)', color: 'from-indigo-900 to-purple-900' },
  { role: 'TRANSPORT_ADMIN', field: 'TRANSPORT', label: '🚌 Transport Admin (EV Fast Charging & MSRTC)', color: 'from-cyan-900 to-sky-900' },
  { role: 'GOVERNMENT_ADMIN', field: 'GOVERNMENT', label: '🏛️ Welfare Schemes Admin (Ladki Bahin & DBT)', color: 'from-purple-950 to-indigo-950' },
  { role: 'HEALTHCARE_ADMIN', field: 'HEALTHCARE', label: '❤️ Healthcare Admin (ICU Beds & Blood Banks)', color: 'from-red-950 to-rose-950' },
  { role: 'ELECTRICITY_ADMIN', field: 'ELECTRICITY', label: '⚡ Electricity Admin (MSEDCL Outages & Grid)', color: 'from-yellow-950 to-amber-950' },
  { role: 'WATER_ADMIN', field: 'WATER', label: '💧 Water Supply Admin (Dam Levels & Tankers)', color: 'from-blue-950 to-sky-950' },
  { role: 'WASTE_ADMIN', field: 'WASTE', label: '♻️ Sanitation & Waste Admin (Compactor Fleet & SWM)', color: 'from-emerald-950 to-teal-950' },
  { role: 'AGRICULTURE_ADMIN', field: 'AGRICULTURE', label: '🌱 Agriculture Admin (APMC Mandi Rates & Agronomy)', color: 'from-green-950 to-emerald-950' },
  { role: 'TOURISM_ADMIN', field: 'TOURISM', label: '🧭 Tourism Admin (Place Moderation & Reviews)', color: 'from-teal-900 to-slate-900' },
  { role: 'COMPLAINTS_ADMIN', field: 'COMPLAINTS', label: '📋 Grievances Admin (Citizen Tickets & Officer Desk)', color: 'from-orange-900 to-slate-900' },
  { role: 'COMMUNITY_MODERATOR', field: 'COMMUNITY', label: '💬 Community Moderator (Feed Posts & Safety)', color: 'from-rose-900 to-slate-900' },
];

export const AdminDashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const paramField = searchParams.get('field')?.toUpperCase();
  const paramRole = searchParams.get('role')?.toUpperCase();

  // Determine initial active panel from URL param, localStorage, or user profile
  const [activePanel, setActivePanel] = useState<string>(() => {
    if (paramField) return paramField;
    if (paramRole) {
      if (paramRole === 'SUPER_ADMIN') return 'SUPER';
      if (paramRole === 'DISTRICT_ADMIN') return 'DISTRICT';
      if (paramRole.endsWith('_ADMIN')) return paramRole.replace('_ADMIN', '');
      if (paramRole.endsWith('_MODERATOR')) return 'COMMUNITY';
    }
    const saved = localStorage.getItem('mr_active_admin_panel');
    if (saved) return saved;
    if (isSuperAdmin(user) || user?.uid === SUPER_ADMIN_UID_LOCAL) return 'SUPER';
    if (user?.role === 'DISTRICT_ADMIN') return 'DISTRICT';
    if (user?.adminField) return user.adminField;
    if (user?.role) {
      const r = user.role.toUpperCase();
      if (r.endsWith('_ADMIN')) return r.replace('_ADMIN', '');
      if (r.endsWith('_MODERATOR')) return 'COMMUNITY';
    }
    return 'GATEWAY';
  });

  const [savingRole, setSavingRole] = useState(false);

  const handleSwitchPanel = async (targetField: string, targetRole: string) => {
    setActivePanel(targetField);
    localStorage.setItem('mr_active_admin_panel', targetField);
    window.history.replaceState(null, '', `?field=${targetField}`);

    // Also persist to current user profile in Firestore and localStorage if logged in
    if (user) {
      setSavingRole(true);
      try {
        await updateUser({
          role: targetRole as UserRole,
          adminField: (targetField !== 'SUPER' && targetField !== 'DISTRICT' ? targetField : undefined) as AdminField,
          isAdmin: true,
        });
      } catch (_) {}
      setSavingRole(false);
    }
  };

  // Render the selected active panel
  const renderPanel = () => {
    switch (activePanel) {
      case 'SUPER':
        return <SuperAdminPortal />;
      case 'DISTRICT':
        return <DistrictAdminPortal />;
      case 'EDUCATION':
        return <EducationAdminPortal />;
      case 'TRANSPORT':
        return <TransportAdminPortal />;
      case 'GOVERNMENT':
        return <GovernmentAdminPortal />;
      case 'HEALTHCARE':
        return <HealthcareAdminPortal />;
      case 'ELECTRICITY':
        return <ElectricityAdminPortal />;
      case 'WATER':
        return <WaterAdminPortal />;
      case 'WASTE':
        return <WasteAdminPortal />;
      case 'AGRICULTURE':
        return <AgricultureAdminPortal />;
      case 'TOURISM':
        return <TourismAdminPortal />;
      case 'COMPLAINTS':
        return <ComplaintsAdminPortal />;
      case 'COMMUNITY':
        return <CommunityModeratorPortal />;
      default:
        // Default Gateway Selector
        return (
          <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-6 pt-6">
              <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 rounded-2xl p-6 shadow-xl border border-amber-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-amber-300/30 text-yellow-300">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="bg-slate-950 text-yellow-400 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                      ADMINISTRATIVE ROLE & PORTAL HUB
                    </span>
                    <h1 className="text-2xl font-black text-white mt-1">Select & Activate Operational Center</h1>
                    <p className="text-amber-100 text-xs mt-0.5">
                      Logged in as <strong className="text-white">{user?.name || user?.email || 'Administrator'}</strong>. Select any role below to activate its dedicated professional management console.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ROLE_PORTAL_OPTIONS.map((item) => (
                  <div
                    key={item.field}
                    onClick={() => handleSwitchPanel(item.field, item.role)}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-5 rounded-2xl space-y-3 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-extrabold text-white text-sm group-hover:text-amber-400 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        Role: <code className="text-amber-300 font-mono">{item.role}</code>
                      </p>
                    </div>
                    <button className="w-full py-2 px-3 bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-white rounded-xl text-xs font-bold transition-all text-center">
                      Activate {item.field} Portal →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Quick Role Switcher Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-500/20 text-yellow-400 rounded-lg border border-amber-500/30">
            <Shield className="w-4 h-4" />
          </span>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Active Admin Role Panel</span>
            <span className="text-white font-black text-xs flex items-center gap-1.5">
              {ROLE_PORTAL_OPTIONS.find((o) => o.field === activePanel)?.label || activePanel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Switch Role Panel:</label>
          <select
            value={activePanel}
            onChange={(e) => {
              const opt = ROLE_PORTAL_OPTIONS.find((o) => o.field === e.target.value);
              if (opt) handleSwitchPanel(opt.field, opt.role);
            }}
            className="bg-slate-950 border border-amber-500/50 text-yellow-300 font-bold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400 shadow-inner"
          >
            {ROLE_PORTAL_OPTIONS.map((opt) => (
              <option key={opt.field} value={opt.field}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setActivePanel('GATEWAY')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs"
          >
            All Roles Hub
          </button>
        </div>
      </div>

      {/* Render Active Portal */}
      {renderPanel()}
    </div>
  );
};

export default AdminDashboardPage;
