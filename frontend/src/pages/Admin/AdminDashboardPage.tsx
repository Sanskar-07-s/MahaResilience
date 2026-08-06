import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import {
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  Megaphone,
  CheckCircle,
  Briefcase,
  RefreshCw,
  Shield,
  Users,
  Pin,
  Trash2,
  Lock,
  UserX,
  Award,
  Upload,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { db } from '../../lib/firebase.ts';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy,
  addDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { AlertItem, AlertPriority, AlertCategory, UserProfile } from '../../types/user.ts';

const MAHARASHTRA_DISTRICTS = [
  'All Districts', 'Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad',
  'Pune', 'Satara', 'Solapur', 'Kolhapur', 'Sangli', 'Nashik', 'Ahmednagar',
  'Jalgaon', 'Dhule', 'Nandurbar', 'Chhatrapati Sambhajinagar (Aurangabad)',
  'Jalna', 'Beed', 'Latur', 'Dharashiv (Osmanabad)', 'Nanded', 'Parbhani',
  'Hingoli', 'Nagpur', 'Wardha', 'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli',
  'Amravati', 'Akola', 'Yavatmal', 'Buldhana', 'Washim'
];

interface Complaint {
  id: string;
  title: string;
  category: string;
  status: string;
  address: string;
  upvotes: number;
  priority: string;
  managerNotes: string;
  citizenName: string;
  photoUrl?: string | null;
  createdAt: string;
}

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ALERTS' | 'USERS' | 'COMPLAINTS' | 'RESOURCES'>('OVERVIEW');

  // Datasets
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Alert publishing form
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDesc, setAlertDesc] = useState('');
  const [alertCategory, setAlertCategory] = useState<AlertCategory>('Disaster');
  const [alertPriority, setAlertPriority] = useState<AlertPriority>('Critical');
  const [alertDistrict, setAlertDistrict] = useState('Pune');
  const [alertIsPinned, setAlertIsPinned] = useState(true);
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Resource Upload state
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('EVACUATION_MAP');
  const [resourceSuccess, setResourceSuccess] = useState(false);

  // Strict Role Guard
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-100 text-danger rounded-full mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 max-w-md mt-2 text-sm">
          You do not have Administrator privileges to view this control center. Only verified Admin accounts can access user moderation and alert dispatching.
        </p>
      </div>
    );
  }

  // Real-time Listeners
  useEffect(() => {
    setLoading(true);

    // Complaints Stream
    const qComplaints = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const unsubComplaints = onSnapshot(qComplaints, (snapshot) => {
      const list: Complaint[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          title: d.title || '',
          category: d.category || '',
          status: d.status || 'PENDING',
          address: d.address || '',
          upvotes: d.upvotes || 0,
          priority: d.priority || 'MEDIUM',
          managerNotes: d.managerNotes || '',
          citizenName: d.citizenName || 'Anonymous',
          photoUrl: d.photoUrl || null,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
        });
      });
      setComplaints(list);
    });

    // Alerts Stream
    const qAlerts = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const list: AlertItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AlertItem);
      });
      setAlerts(list);
    });

    // Users Stream
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      setUsersList(list);
      setLoading(false);
    });

    return () => {
      unsubComplaints();
      unsubAlerts();
      unsubUsers();
    };
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const docRef = doc(db, 'complaints', id);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      console.error('Firestore update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSuccess(false);

    try {
      const alertData: Omit<AlertItem, 'id'> = {
        title: alertTitle,
        description: alertDesc,
        category: alertCategory,
        priority: alertPriority,
        district: alertDistrict,
        isPinned: alertPriority === 'Critical' ? true : alertIsPinned,
        status: 'ACTIVE',
        createdBy: user?.uid || 'admin',
        createdAt: new Date().toISOString(),
      };

      // Push to Firestore
      await addDoc(collection(db, 'alerts'), alertData);

      // Record Audit Log
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid,
        action: 'CREATE_ALERT',
        target: alertTitle,
        timestamp: new Date().toISOString(),
      });

      setAlertSuccess(true);
      setAlertTitle('');
      setAlertDesc('');
      setTimeout(() => setAlertSuccess(false), 4000);
    } catch (err) {
      console.error('Publish alert error:', err);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', id));
    } catch (err) {
      console.error('Delete alert error:', err);
    }
  };

  const handleTogglePinAlert = async (id: string, currentPinned: boolean) => {
    try {
      await updateDoc(doc(db, 'alerts', id), { isPinned: !currentPinned });
    } catch (err) {
      console.error('Toggle pin error:', err);
    }
  };

  const handleApproveVolunteer = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: 'VOLUNTEER', isVerified: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserSuspension = async (uid: string, currentSuspended?: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isSuspended: !currentSuspended });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignRole = async (uid: string, newRole: UserProfile['role']) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (err) {
      console.error(err);
    }
  };

  const unresolved = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED');
  const criticalAlerts = alerts.filter(a => a.priority === 'Critical' && a.status === 'ACTIVE');
  const volunteers = usersList.filter(u => u.role === 'VOLUNTEER');

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-100 text-danger text-xs font-bold px-2.5 py-1 rounded-md3 uppercase flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Verified Administrator Control
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mt-2">MahaResilience Official Control Center</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Publish critical warnings, verify volunteer assets, moderate citizen accounts, and route emergency resources.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-md3 border border-slate-border text-xs font-semibold overflow-x-auto max-w-full">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: TrendingUp },
            { id: 'ALERTS', label: 'Alert Studio', icon: Megaphone },
            { id: 'USERS', label: 'Users & Volunteers', icon: Users },
            { id: 'COMPLAINTS', label: 'Complaints Feed', icon: FileSpreadsheet },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md3 transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 text-primary" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Critical Alerts', value: criticalAlerts.length, desc: 'Pinned emergency warnings', icon: AlertTriangle, color: 'bg-red-50 text-danger' },
          { label: 'Total Registered Users', value: usersList.length, desc: 'Citizens, volunteers & staff', icon: Users, color: 'bg-blue-50 text-blue-700' },
          { label: 'Unresolved Complaints', value: unresolved.length, desc: 'Grievances pending action', icon: FileSpreadsheet, color: 'bg-amber-50 text-amber-700' },
          { label: 'Verified Volunteers', value: volunteers.length, desc: 'Enrolled rescue assets', icon: UserCheck, color: 'bg-green-50 text-green-700' },
        ].map((stat, idx) => (
          <div key={idx} className="p-6 rounded-md3 border border-slate-border bg-white shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-md3 ${stat.color.split(' ')[0]}`}>
              <stat.icon className={`w-6 h-6 ${stat.color.split(' ')[1]}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* OVERVIEW & ALERT PUBLISHER */}
      {(activeTab === 'OVERVIEW' || activeTab === 'ALERTS') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alert Publishing Studio */}
          <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm h-fit space-y-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-danger" /> Publish Regional Alert
            </h3>

            {alertSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md3 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Alert published and routed to regional users.
              </div>
            )}

            <form onSubmit={handlePublishAlert} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Alert Title</label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-danger/20 text-xs font-semibold"
                  placeholder="e.g. 🚨 CRITICAL: Flooding in River Basin"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Alert Description & Instructions</label>
                <textarea
                  value={alertDesc}
                  onChange={(e) => setAlertDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-danger/20 text-xs font-semibold"
                  placeholder="Describe emergency evacuation steps or infrastructure guidance..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select
                    value={alertCategory}
                    onChange={(e) => setAlertCategory(e.target.value as any)}
                    className="w-full px-2 py-2 rounded bg-white border border-slate-border outline-none text-xs font-semibold"
                  >
                    <option value="Disaster">Disaster</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Weather">Weather</option>
                    <option value="Government">Government</option>
                    <option value="Health">Health</option>
                    <option value="Traffic">Traffic</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Priority</label>
                  <select
                    value={alertPriority}
                    onChange={(e) => setAlertPriority(e.target.value as any)}
                    className="w-full px-2 py-2 rounded bg-white border border-slate-border outline-none text-xs font-semibold"
                  >
                    <option value="Critical">🚨 Critical (Pinned)</option>
                    <option value="High">⚠️ High Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low Information</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Target District</label>
                <select
                  value={alertDistrict}
                  onChange={(e) => setAlertDistrict(e.target.value)}
                  className="w-full px-2 py-2 rounded bg-white border border-slate-border outline-none text-xs font-semibold"
                >
                  {MAHARASHTRA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-danger hover:bg-danger-hover text-white py-2.5 rounded-md3 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                Publish Emergency Alert
              </button>
            </form>
          </div>

          {/* Active Alerts List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-md3 border border-slate-border shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Active Regional Alerts ({alerts.length})
            </h3>

            {alerts.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No active alerts published.</p>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-md3 border space-y-2 ${
                      alert.priority === 'Critical'
                        ? 'bg-red-50/50 border-red-200'
                        : 'bg-slate-50 border-slate-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                              alert.priority === 'Critical'
                                ? 'bg-red-600 text-white'
                                : alert.priority === 'High'
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {alert.priority}
                          </span>
                          <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                            {alert.category}
                          </span>
                          {alert.isPinned && (
                            <span className="text-[9px] bg-yellow-400 text-slate-900 font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{alert.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          District: {alert.district || 'All'} · Created: {alert.createdAt ? (typeof alert.createdAt === 'string' ? new Date(alert.createdAt).toLocaleString() : (alert.createdAt as any).toDate ? (alert.createdAt as any).toDate().toLocaleString() : new Date().toLocaleString()) : new Date().toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => alert.id && handleTogglePinAlert(alert.id, alert.isPinned)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md3 hover:bg-white"
                          title="Toggle Pin"
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert.id && handleDeleteAlert(alert.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md3 hover:bg-white"
                          title="Remove Alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* USERS & VOLUNTEERS MODERATION STUDIO */}
      {activeTab === 'USERS' && (
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Citizen & Volunteer Moderation ({usersList.length})
            </h3>
            <span className="text-xs text-slate-400">Manage user roles and volunteer status</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-border bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="p-3">User / Name</th>
                  <th className="p-3">Email / Contact</th>
                  <th className="p-3">Current Role</th>
                  <th className="p-3">District</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {usersList.map((usr) => (
                  <tr key={usr.uid} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">
                      <div>
                        <p>{usr.name || 'Anonymous'}</p>
                        {usr.isSuspended && (
                          <span className="text-[9px] bg-red-100 text-danger px-1.5 py-0.5 rounded font-bold">SUSPENDED</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{usr.email || usr.phone || 'N/A'}</td>
                    <td className="p-3">
                      <select
                        value={usr.role}
                        onChange={(e) => handleAssignRole(usr.uid, e.target.value as any)}
                        className="text-xs px-2 py-1 bg-white border border-slate-border rounded font-bold uppercase text-slate-700"
                      >
                        <option value="CITIZEN">Citizen</option>
                        <option value="VOLUNTEER">Volunteer</option>
                        <option value="OFFICIAL">Official</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-500">{usr.district || 'Maharashtra'}</td>
                    <td className="p-3 text-right space-x-2">
                      {usr.role !== 'VOLUNTEER' && (
                        <button
                          onClick={() => handleApproveVolunteer(usr.uid)}
                          className="px-2.5 py-1 bg-green-100 text-green-800 rounded font-semibold text-[10px] hover:bg-green-200"
                        >
                          Approve Volunteer
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleUserSuspension(usr.uid, usr.isSuspended)}
                        className={`px-2.5 py-1 rounded font-semibold text-[10px] ${
                          usr.isSuspended
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-red-100 text-danger hover:bg-red-200'
                        }`}
                      >
                        {usr.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLAINTS FEED TAB */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" /> Live Municipal Grievances ({complaints.length})
          </h3>

          <div className="space-y-4">
            {complaints.map((c) => (
              <div key={c.id} className="p-4 border border-slate-border rounded-md3 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{c.title}</h4>
                    <p className="text-xs text-slate-500">{c.address}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By: {c.citizenName} · {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                    className="text-xs px-2.5 py-1 rounded border font-bold uppercase"
                  >
                    <option value="PENDING">⏳ Pending</option>
                    <option value="IN_PROGRESS">🔧 In Progress</option>
                    <option value="RESOLVED">✅ Resolved</option>
                    <option value="REJECTED">❌ Rejected</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
