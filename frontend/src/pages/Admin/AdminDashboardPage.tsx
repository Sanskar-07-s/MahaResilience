import React from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { SUPER_ADMIN_UID_LOCAL, isSuperAdmin } from '../../utils/permissions.ts';

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

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // 1. Existing Permanent Super Admin (gfhWRztes9dYzGzHBu9MjZH5Uuo2) -> Master Control Center
  if (isSuperAdmin(user) || user?.uid === SUPER_ADMIN_UID_LOCAL) {
    return <SuperAdminPortal />;
  }

  // 2. District Admin -> District Operations Center
  if (user?.role === 'DISTRICT_ADMIN') {
    return <DistrictAdminPortal />;
  }

  // 3. Community Moderator -> Community Moderation Queue
  if (user?.role === 'MODERATOR' || user?.role === 'COMMUNITY_MODERATOR') {
    return <CommunityModeratorPortal />;
  }

  // 4. Module Admin -> Specialized Portal based on user.adminField
  if (user?.role === 'MODULE_ADMIN' || user?.role?.includes('ADMIN')) {
    const field = user?.adminField;

    switch (field) {
      case 'EMERGENCY':
        return <EmergencyAdminPortal />;
      case 'HEALTHCARE':
        return <HealthcareAdminPortal />;
      case 'GOVERNMENT':
        return <GovernmentAdminPortal />;
      case 'WATER':
        return <WaterAdminPortal />;
      case 'ELECTRICITY':
        return <ElectricityAdminPortal />;
      case 'WASTE':
        return <WasteAdminPortal />;
      case 'AGRICULTURE':
        return <AgricultureAdminPortal />;
      case 'EDUCATION':
        return <EducationAdminPortal />;
      case 'TRANSPORT':
        return <TransportAdminPortal />;
      case 'TOURISM':
        return <TourismAdminPortal />;
      case 'COMPLAINTS':
        return <ComplaintsAdminPortal />;
      case 'COMMUNITY':
        return <CommunityModeratorPortal />;
      default:
        // Role is MODULE_ADMIN but adminField is missing or unassigned
        return (
          <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center font-sans">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md space-y-4">
              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 w-12 h-12 mx-auto flex items-center justify-center font-black">
                !
              </div>
              <h2 className="text-xl font-extrabold text-white">Administrator Configuration Incomplete</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account is designated as an Administrator, but no specialized <code className="text-amber-300">adminField</code> has been assigned to your profile yet.
              </p>
              <p className="text-xs text-slate-500">
                Please contact the Master Super Admin (<code className="text-slate-400">gfhWRztes9dYzGzHBu9MjZH5Uuo2</code>) to assign your operational admin field.
              </p>
            </div>
          </div>
        );
    }
  }

  // Fallback for unauthorized access attempts
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md space-y-3">
        <h2 className="text-xl font-extrabold text-red-400">Access Restricted</h2>
        <p className="text-xs text-slate-400">Administrative portals require authorized admin credentials.</p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
