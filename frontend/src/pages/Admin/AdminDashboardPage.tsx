import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { SUPER_ADMIN_UID_LOCAL, isSuperAdmin, canAccessAdmin } from '../../utils/permissions.ts';
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

export const normalizeAdminField = (field?: string | null): string => {
  if (!field) return '';
  const f = field.toUpperCase().trim();
  if (['GOVERNMENT', 'SCHEMES', 'WELFARE', 'DBT', 'GOV'].includes(f)) return 'GOVERNMENT';
  if (['WASTE', 'SANITATION', 'SWM', 'CLEANLINESS'].includes(f)) return 'WASTE';
  if (['AGRICULTURE', 'AGRI', 'APMC', 'FARMER', 'MANDI'].includes(f)) return 'AGRICULTURE';
  if (['ELECTRICITY', 'POWER', 'MSEDCL', 'GRID'].includes(f)) return 'ELECTRICITY';
  if (['HEALTHCARE', 'HEALTH', 'HOSPITAL'].includes(f)) return 'HEALTHCARE';
  if (['TRANSPORT', 'TRANSIT'].includes(f)) return 'TRANSPORT';
  if (['EDUCATION', 'SCHOOL'].includes(f)) return 'EDUCATION';
  if (['COMPLAINTS', 'GRIEVANCES'].includes(f)) return 'COMPLAINTS';
  if (['TOURISM'].includes(f)) return 'TOURISM';
  if (['EMERGENCY', 'DISASTER'].includes(f)) return 'EMERGENCY';
  if (['SUPER', 'ADMIN'].includes(f)) return 'SUPER';
  if (['DISTRICT'].includes(f)) return 'DISTRICT';
  return f;
};

export const AdminDashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const rawParamField = searchParams.get('field');
  const paramField = normalizeAdminField(rawParamField);
  const paramRole = searchParams.get('role')?.toUpperCase();

  const isUserSuperAdmin = isSuperAdmin(user) || user?.uid === SUPER_ADMIN_UID_LOCAL || user?.role === 'SUPER_ADMIN';
  const hasAdminAccess = canAccessAdmin(user) || isUserSuperAdmin || user?.role === 'ADMIN';

  // Determine user's allocated admin field from database
  const userRoleStr = String(user?.role || '');
  let userAllocatedField = user?.adminField ? normalizeAdminField(user.adminField) : undefined;
  if (!userAllocatedField && userRoleStr.endsWith('_ADMIN') && userRoleStr !== 'SUPER_ADMIN' && userRoleStr !== 'DISTRICT_ADMIN') {
    userAllocatedField = normalizeAdminField(userRoleStr.replace('_ADMIN', '')) as AdminField;
  } else if (!userAllocatedField && userRoleStr === 'DISTRICT_ADMIN') {
    userAllocatedField = 'DISTRICT' as any;
  }

  // Determine initial active panel based on role allocation
  const [activePanel, setActivePanel] = useState<string>(() => {
    if (paramField) return paramField;
    if (paramRole) {
      if (paramRole === 'SUPER_ADMIN') return 'SUPER';
      if (paramRole === 'DISTRICT_ADMIN') return 'DISTRICT';
      if (paramRole.endsWith('_ADMIN')) return normalizeAdminField(paramRole.replace('_ADMIN', ''));
      if (paramRole.endsWith('_MODERATOR')) return 'COMMUNITY';
    }

    if (isUserSuperAdmin) {
      return localStorage.getItem('mr_active_admin_panel') || 'SUPER';
    }

    // For non-Super Admin module admins, force allocation to their assigned field
    if (userAllocatedField) {
      return userAllocatedField;
    }

    return paramField || 'GATEWAY';
  });

  // Keep active panel synchronized whenever URL query changes
  useEffect(() => {
    const rawField = searchParams.get('field');
    if (rawField) {
      const normalized = normalizeAdminField(rawField);
      if (normalized && normalized !== activePanel) {
        setActivePanel(normalized);
        localStorage.setItem('mr_active_admin_panel', normalized);
      }
    }
  }, [searchParams, location.search]);

  // Ensure non-super admin stays on their allocated panel
  useEffect(() => {
    if (!isUserSuperAdmin && userAllocatedField && activePanel !== userAllocatedField && !paramField) {
      setActivePanel(userAllocatedField);
    }
  }, [isUserSuperAdmin, userAllocatedField, activePanel, paramField]);

  const [savingRole, setSavingRole] = useState(false);

  const handleSwitchPanel = async (targetField: string, targetRole: string) => {
    if (!isUserSuperAdmin && userAllocatedField && targetField !== userAllocatedField) {
      alert(`Access Restricted: Your assigned database role is locked to the ${userAllocatedField} Operational Portal.`);
      return;
    }

    const normalized = normalizeAdminField(targetField);
    setActivePanel(normalized);
    setSearchParams({ field: normalized });
    localStorage.setItem('mr_active_admin_panel', normalized);

    if (user && isUserSuperAdmin) {
      setSavingRole(true);
      try {
        await updateUser({
          role: targetRole as UserRole,
          adminField: (normalized !== 'SUPER' && normalized !== 'DISTRICT' ? normalized : undefined) as AdminField,
          isAdmin: true,
        });
      } catch (_) {}
      setSavingRole(false);
    }
  };

  // If user does not have admin access in database
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
              ACCESS RESTRICTED
            </span>
            <h1 className="text-xl font-black text-white mt-2">Administrative Role Required</h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Logged in as <strong className="text-white">{user?.email || 'Citizen User'}</strong>. Your account has the assigned database role of <code className="text-amber-400 font-mono font-bold">{user?.role || 'CITIZEN'}</code>.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Admin panel access is allocated strictly via backend database roles. Please contact your Super Administrator to request role elevation.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <a
              href="/dashboard"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all"
            >
              Return to Citizen Dashboard →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render the selected active panel
  const renderPanel = () => {
    switch (activePanel) {
      case 'SUPER':
        return <SuperAdminPortal />;
      case 'DISTRICT':
        return <DistrictAdminPortal />;
      case 'EDUCATION':
      case 'SCHOOL':
        return <EducationAdminPortal />;
      case 'TRANSPORT':
      case 'TRANSIT':
        return <TransportAdminPortal />;
      case 'GOVERNMENT':
      case 'SCHEMES':
      case 'WELFARE':
      case 'DBT':
      case 'GOV':
        return <GovernmentAdminPortal />;
      case 'HEALTHCARE':
      case 'HEALTH':
      case 'HOSPITAL':
        return <HealthcareAdminPortal />;
      case 'ELECTRICITY':
      case 'POWER':
      case 'MSEDCL':
      case 'GRID':
        return <ElectricityAdminPortal />;
      case 'WATER':
        return <WaterAdminPortal />;
      case 'WASTE':
      case 'SANITATION':
      case 'SWM':
      case 'CLEANLINESS':
        return <WasteAdminPortal />;
      case 'AGRICULTURE':
      case 'AGRI':
      case 'APMC':
      case 'FARMER':
      case 'MANDI':
        return <AgricultureAdminPortal />;
      case 'TOURISM':
        return <TourismAdminPortal />;
      case 'COMPLAINTS':
      case 'GRIEVANCES':
        return <ComplaintsAdminPortal />;
      case 'COMMUNITY':
        return <CommunityModeratorPortal />;
      case 'EMERGENCY':
      case 'DISASTER':
        return <EmergencyAdminPortal />;
      default:
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
                      Logged in as <strong className="text-white">{user?.name || user?.email || 'Administrator'}</strong>. Assigned Role: <code className="bg-slate-950 text-yellow-300 font-mono px-2 py-0.5 rounded">{user?.role}</code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ROLE_PORTAL_OPTIONS.filter((item) => isUserSuperAdmin || item.field === userAllocatedField).map((item) => (
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

        {isUserSuperAdmin && (
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Super Admin Switcher:</label>
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
        )}
      </div>

      {/* Render Active Portal */}
      {renderPanel()}
    </div>
  );
};

export default AdminDashboardPage;
