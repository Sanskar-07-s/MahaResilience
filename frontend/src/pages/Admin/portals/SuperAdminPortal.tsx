import React, { useState, useEffect } from 'react';
import {
  Crown, Users, Shield, Server, FileText, Activity, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, Lock, UserPlus, Eye, Edit3, Trash2, Zap, Settings, Search, MapPin,
  Radio, Compass, HeartPulse, Droplet, Sprout, Landmark, GraduationCap, Bus, FileSpreadsheet, MessageSquare
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, setDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import { useEmergencyMode } from '../../../contexts/EmergencyModeContext.tsx';
import { UserProfile, AdminField, UserRole } from '../../../types/user.ts';

// Embed complete module operational portals for Super Admin
import { EmergencyAdminPortal } from './EmergencyAdminPortal.tsx';
import { TourismAdminPortal } from './TourismAdminPortal.tsx';
import { HealthcareAdminPortal } from './HealthcareAdminPortal.tsx';
import { WaterAdminPortal } from './WaterAdminPortal.tsx';
import { ElectricityAdminPortal } from './ElectricityAdminPortal.tsx';
import { WasteAdminPortal } from './WasteAdminPortal.tsx';
import { AgricultureAdminPortal } from './AgricultureAdminPortal.tsx';
import { EducationAdminPortal } from './EducationAdminPortal.tsx';
import { TransportAdminPortal } from './TransportAdminPortal.tsx';
import { GovernmentAdminPortal } from './GovernmentAdminPortal.tsx';
import { ComplaintsAdminPortal } from './ComplaintsAdminPortal.tsx';
import { CommunityModeratorPortal } from './CommunityModeratorPortal.tsx';

export const SuperAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const { isEmergencyMode, activateEmergencyMode, deactivateEmergencyMode } = useEmergencyMode();
  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'EMERGENCY'
    | 'TOURISM'
    | 'HEALTHCARE'
    | 'WATER'
    | 'ELECTRICITY'
    | 'WASTE'
    | 'AGRICULTURE'
    | 'EDUCATION'
    | 'TRANSPORT'
    | 'GOVERNMENT'
    | 'COMPLAINTS'
    | 'COMMUNITY'
    | 'USERS'
    | 'ADMINS'
    | 'AUDIT_LOGS'
  >('OVERVIEW');

  // Real-time metrics
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [pendingPlacesCount, setPendingPlacesCount] = useState(0);

  // Admin Creator Form
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<UserRole>('MODULE_ADMIN');
  const [adminField, setAdminField] = useState<AdminField>('TOURISM');
  const [adminDistrict, setAdminDistrict] = useState('Kolhapur');
  const [adminStatus, setAdminStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      setUsersList(list);
    });

    const unsubAlerts = onSnapshot(collection(db, 'alerts'), (snap) => setAlertsCount(snap.size));
    const unsubComp = onSnapshot(collection(db, 'complaints'), (snap) => setComplaintsCount(snap.size));
    const unsubPlaces = onSnapshot(collection(db, 'places'), (snap) => {
      const pending = snap.docs.filter((d) => d.data().status === 'pending').length;
      setPendingPlacesCount(pending);
    });

    const unsubLogs = onSnapshot(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc')), (snap) => {
      setAuditLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub();
      unsubAlerts();
      unsubComp();
      unsubPlaces();
      unsubLogs();
    };
  }, []);

  const handleCreateModuleAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminName.trim()) return;

    // Safety guard: Super Admin UID is fixed to gfhWRztes9dYzGzHBu9MjZH5Uuo2
    if (adminRole === 'SUPER_ADMIN') {
      alert('Security Protection: Only the existing permanent Super Admin (gfhWRztes9dYzGzHBu9MjZH5Uuo2) can possess SUPER_ADMIN role.');
      return;
    }

    setSubmittingAdmin(true);
    setSuccessMsg('');

    try {
      const uid = 'admin_' + Date.now();
      const newAdminObj: Partial<UserProfile> = {
        uid,
        name: adminName.trim(),
        email: adminEmail.trim(),
        role: adminRole,
        adminField: adminRole === 'MODULE_ADMIN' ? adminField : undefined,
        district: adminDistrict,
        assignedAreas: [adminDistrict],
        status: adminStatus,
        permissions: ['*'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), newAdminObj);

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'SUPER_ADMIN',
        adminRole: 'SUPER_ADMIN',
        action: 'CREATE_MODULE_ADMIN',
        module: 'SYSTEM_SETTINGS',
        targetId: uid,
        timestamp: new Date().toISOString(),
        details: `Created ${adminRole} (${adminField}) for ${adminDistrict}`,
      });

      setSuccessMsg(`Successfully created ${adminName} as ${adminRole} (${adminField}) for ${adminDistrict}!`);
      setAdminName('');
      setAdminEmail('');
    } catch (err: any) {
      alert('Failed to create admin: ' + err.message);
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const toggleUserStatus = async (targetUser: UserProfile) => {
    if (targetUser.uid === 'gfhWRztes9dYzGzHBu9MjZH5Uuo2') {
      alert('Security Protection: The Master Super Admin account cannot be suspended.');
      return;
    }

    const nextStatus = targetUser.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'SUPER_ADMIN',
        adminRole: 'SUPER_ADMIN',
        action: nextStatus === 'SUSPENDED' ? 'SUSPEND_USER' : 'REACTIVATE_USER',
        module: 'USER_MANAGEMENT',
        targetId: targetUser.uid,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-amber-300/30 text-yellow-300">
              <Crown className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-950 text-yellow-400 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  MASTER CONTROL CENTER
                </span>
                <span className="text-xs text-amber-100 font-semibold">UID: gfhWRztes9dYzGzHBu9MjZH5Uuo2</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                MahaResilience Super Admin Portal
              </h1>
              <p className="text-amber-100 text-xs mt-0.5">
                Full Unrestricted Platform Authority Across All 12 Operational Modules
              </p>
            </div>
          </div>

          {/* Statewide Emergency Switch */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-400/30 flex items-center gap-3">
            <Zap className={`w-5 h-5 ${isEmergencyMode ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Statewide Emergency Mode</div>
              <div className="text-xs font-black text-white">{isEmergencyMode ? 'ACTIVE' : 'NORMAL'}</div>
            </div>
            <button
              onClick={() => (isEmergencyMode ? deactivateEmergencyMode() : activateEmergencyMode())}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                isEmergencyMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              {isEmergencyMode ? 'Deactivate' : '⚡ Activate'}
            </button>
          </div>
        </div>

        {/* Master Navigation Bar */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2 text-xs no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'Master Overview', icon: Activity },
            { id: 'EMERGENCY', label: 'Disaster EOC', icon: Radio },
            { id: 'TOURISM', label: 'Tourism', icon: Compass },
            { id: 'COMPLAINTS', label: 'Grievances', icon: FileSpreadsheet },
            { id: 'HEALTHCARE', label: 'Healthcare', icon: HeartPulse },
            { id: 'WATER', label: 'Water Supply', icon: Droplet },
            { id: 'ELECTRICITY', label: 'Electricity', icon: Zap },
            { id: 'WASTE', label: 'Sanitation', icon: Trash2 },
            { id: 'AGRICULTURE', label: 'Agriculture', icon: Sprout },
            { id: 'GOVERNMENT', label: 'Schemes', icon: Landmark },
            { id: 'COMMUNITY', label: 'Moderation', icon: MessageSquare },
            { id: 'USERS', label: 'User Directory', icon: Users },
            { id: 'ADMINS', label: 'Admin Assignment', icon: UserPlus },
            { id: 'AUDIT_LOGS', label: 'Audit Logs', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 border ${
                  active
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-xs font-semibold">Total Registered Users</div>
                <div className="text-2xl font-black text-white mt-1">{usersList.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-xs font-semibold">Active Disaster Alerts</div>
                <div className="text-2xl font-black text-red-400 mt-1">{alertsCount}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-xs font-semibold">Citizen Complaints</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{complaintsCount}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-xs font-semibold">Pending Tourist Submissions</div>
                <div className="text-2xl font-black text-teal-400 mt-1">{pendingPlacesCount}</div>
              </div>
            </div>

            {/* Switcher Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" /> Direct Operational Control Access
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { id: 'EMERGENCY', label: 'Disaster EOC Alert Studio', color: 'text-red-400' },
                  { id: 'TOURISM', label: 'Tourism Place Approvals', color: 'text-teal-400' },
                  { id: 'COMPLAINTS', label: 'Grievance Case Management', color: 'text-orange-400' },
                  { id: 'HEALTHCARE', label: 'Healthcare & Bed Verification', color: 'text-emerald-400' },
                  { id: 'WATER', label: 'Water Tankers & Supply', color: 'text-blue-400' },
                  { id: 'ELECTRICITY', label: 'MSEDCL Outage Control', color: 'text-yellow-400' },
                  { id: 'WASTE', label: 'Sanitation & Waste Pickup', color: 'text-emerald-300' },
                  { id: 'AGRICULTURE', label: 'APMC Agriculture Rates', color: 'text-green-400' },
                  { id: 'GOVERNMENT', label: 'Welfare Schemes Center', color: 'text-purple-400' },
                  { id: 'COMMUNITY', label: 'Community Moderation Queue', color: 'text-rose-400' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveTab(m.id as any)}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl space-y-1 text-left transition-all"
                  >
                    <span className={`font-extrabold block text-xs ${m.color}`}>{m.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Open Module Portal →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EMBEDDED SPECIALIZED PORTALS */}
        {activeTab === 'EMERGENCY' && <EmergencyAdminPortal />}
        {activeTab === 'TOURISM' && <TourismAdminPortal />}
        {activeTab === 'HEALTHCARE' && <HealthcareAdminPortal />}
        {activeTab === 'WATER' && <WaterAdminPortal />}
        {activeTab === 'ELECTRICITY' && <ElectricityAdminPortal />}
        {activeTab === 'WASTE' && <WasteAdminPortal />}
        {activeTab === 'AGRICULTURE' && <AgricultureAdminPortal />}
        {activeTab === 'EDUCATION' && <EducationAdminPortal />}
        {activeTab === 'TRANSPORT' && <TransportAdminPortal />}
        {activeTab === 'GOVERNMENT' && <GovernmentAdminPortal />}
        {activeTab === 'COMPLAINTS' && <ComplaintsAdminPortal />}
        {activeTab === 'COMMUNITY' && <CommunityModeratorPortal />}

        {/* TAB: USER DIRECTORY */}
        {activeTab === 'USERS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-extrabold text-white">Registered Platform Users</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, email, role..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Admin Field</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-850/50">
                      <td className="p-3">
                        <div className="font-bold text-white">{u.name || 'Citizen'}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-3 font-semibold text-yellow-400">{u.role || 'USER'}</td>
                      <td className="p-3 font-mono text-teal-300">{u.adminField || '—'}</td>
                      <td className="p-3 text-slate-300">{u.district || 'All'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === 'SUSPENDED' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.uid !== 'gfhWRztes9dYzGzHBu9MjZH5Uuo2' && (
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                          >
                            {u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ADMIN CREATION */}
        {activeTab === 'ADMINS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white">Create / Assign Module Administrator</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign specialized operational portals and geographic boundaries to new admin accounts.
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateModuleAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Rajesh Patil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin.tourism@maharesilience.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Role</label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MODULE_ADMIN">MODULE_ADMIN</option>
                    <option value="DISTRICT_ADMIN">DISTRICT_ADMIN</option>
                    <option value="MODERATOR">MODERATOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Specialized Admin Field</label>
                  <select
                    value={adminField}
                    onChange={(e) => setAdminField(e.target.value as AdminField)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="EMERGENCY">EMERGENCY (Disaster EOC)</option>
                    <option value="TOURISM">TOURISM (Place Approval)</option>
                    <option value="HEALTHCARE">HEALTHCARE (Hospitals & Beds)</option>
                    <option value="WATER">WATER (Tankers & Supply)</option>
                    <option value="ELECTRICITY">ELECTRICITY (MSEDCL Outages)</option>
                    <option value="WASTE">WASTE (Pickup & Dumping)</option>
                    <option value="AGRICULTURE">AGRICULTURE (APMC Mandi)</option>
                    <option value="EDUCATION">EDUCATION (Institutions)</option>
                    <option value="TRANSPORT">TRANSPORT (Transit Alerts)</option>
                    <option value="GOVERNMENT">GOVERNMENT (Welfare Schemes)</option>
                    <option value="COMPLAINTS">COMPLAINTS (Case Management)</option>
                    <option value="COMMUNITY">COMMUNITY (Moderation)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Assigned District</label>
                  <select
                    value={adminDistrict}
                    onChange={(e) => setAdminDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  >
                    {['Kolhapur', 'Pune', 'Mumbai', 'Satara', 'Solapur', 'Sangli', 'Nashik', 'Nagpur', 'All Districts'].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAdmin}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-3 rounded-xl transition-all shadow-lg hover-scale disabled:opacity-50 mt-2"
              >
                {submittingAdmin ? 'Creating Admin...' : 'Create Specialized Admin Account'}
              </button>
            </form>
          </div>
        )}

        {/* TAB: AUDIT LOGS */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">System Administrative Audit Trail</h3>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-400">{log.action}</span>
                    <span className="text-slate-400 ml-2">by {log.adminRole}</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">{log.details || log.targetId}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
