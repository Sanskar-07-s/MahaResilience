import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useEmergencyMode } from '../../contexts/EmergencyModeContext.tsx';
import { AdminGuard } from '../../components/auth/AdminGuard.tsx';
import { isSuperAdmin } from '../../utils/permissions.ts';
import { db } from '../../lib/firebase.ts';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  where,
  limit
} from 'firebase/firestore';
import { AlertItem, AlertPriority, AlertCategory, UserProfile, AuditLog } from '../../types/user.ts';
import {
  Shield, Megaphone, Users, FileSpreadsheet, Activity, BarChart2,
  ClipboardList, AlertTriangle, CheckCircle, RefreshCw, Pin, Trash2,
  Zap, ZapOff, TrendingUp, Map, Bell, User, Lock, Unlock, Award,
  Search, Filter, Download, Upload, Eye, Edit, XCircle, Clock,
  Building, HeartPulse, Truck, Volume2, ChevronDown, ChevronRight,
  Flame, Waves, Wind, Thermometer, Bug, Droplets, Power, Radio,
  Globe, ShieldAlert
} from 'lucide-react';

const SUPER_ADMIN_UID = 'gfhWRztes9dYzGzHBu9MjZH5Uuo2';

const MAHARASHTRA_DISTRICTS = [
  'All Districts', 'Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad',
  'Pune', 'Satara', 'Solapur', 'Kolhapur', 'Sangli', 'Nashik', 'Ahmednagar',
  'Jalgaon', 'Dhule', 'Nandurbar', 'Chhatrapati Sambhajinagar', 'Jalna', 'Beed',
  'Latur', 'Dharashiv', 'Nanded', 'Parbhani', 'Hingoli', 'Nagpur', 'Wardha',
  'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli', 'Amravati', 'Akola',
  'Yavatmal', 'Buldhana', 'Washim'
];

const ALERT_TEMPLATES = [
  { icon: Waves, label: 'Flood Warning', category: 'Disaster' as AlertCategory, priority: 'Critical' as AlertPriority, title: '🌊 FLOOD WARNING: Rising Water Levels — Evacuate Low-Lying Areas', desc: 'Flash flood advisory issued. River levels critically high. Residents near riverbanks must evacuate to designated shelters immediately.' },
  { icon: Wind, label: 'Cyclone Alert', category: 'Disaster' as AlertCategory, priority: 'Critical' as AlertPriority, title: '🌀 CYCLONE ALERT: Severe Storm Approaching Coastal Maharashtra', desc: 'Cyclonic storm expected to make landfall in 24 hours. Coastal residents must move inland. Fishing community must return to shore.' },
  { icon: Flame, label: 'Fire Emergency', category: 'Emergency' as AlertCategory, priority: 'Critical' as AlertPriority, title: '🔥 FIRE EMERGENCY: Major Blaze Reported', desc: 'Emergency response teams deployed. Citizens must maintain safe distance. Do not attempt independent fire containment.' },
  { icon: Thermometer, label: 'Heatwave Warning', category: 'Weather' as AlertCategory, priority: 'High' as AlertPriority, title: '🌡️ HEATWAVE ALERT: Extreme Temperatures Forecast', desc: 'Temperature may exceed 45°C. Avoid outdoor activity between 11am–4pm. Hydration centers open at municipal buildings.' },
  { icon: Activity, label: 'Earthquake', category: 'Disaster' as AlertCategory, priority: 'Critical' as AlertPriority, title: '⚠️ EARTHQUAKE ALERT: Seismic Activity Detected', desc: 'Earthquake tremors recorded. Move to open ground. Avoid elevators. Aftershocks possible. Await official clearance before re-entering buildings.' },
  { icon: Bug, label: 'Disease Outbreak', category: 'Health' as AlertCategory, priority: 'High' as AlertPriority, title: '🦠 HEALTH ADVISORY: Disease Outbreak Alert', desc: 'Health authorities monitoring disease cluster. Citizens advised to maintain hygiene, avoid crowded places, and report symptoms immediately.' },
  { icon: Droplets, label: 'Water Shortage', category: 'Infrastructure' as AlertCategory, priority: 'Medium' as AlertPriority, title: '💧 WATER SUPPLY DISRUPTION', desc: 'Water supply interrupted due to pipeline maintenance. Tanker water service will be provided at designated collection points.' },
  { icon: Power, label: 'Power Failure', category: 'Infrastructure' as AlertCategory, priority: 'Medium' as AlertPriority, title: '⚡ POWER OUTAGE: Scheduled Maintenance', desc: 'Planned power shutdown in your area for grid maintenance. Essential services on backup supply.' },
  { icon: Truck, label: 'Traffic Advisory', category: 'Traffic' as AlertCategory, priority: 'Low' as AlertPriority, title: '🚦 TRAFFIC ADVISORY: Route Disruptions', desc: 'Traffic disruptions expected due to ongoing works. Use alternate routes as advised by traffic management.' },
  { icon: Building, label: 'Government Notice', category: 'Government' as AlertCategory, priority: 'Low' as AlertPriority, title: '📢 GOVERNMENT ANNOUNCEMENT', desc: 'Official government notice. Please refer to official channels for more information.' },
  { icon: Globe, label: 'Public Warning', category: 'Emergency' as AlertCategory, priority: 'High' as AlertPriority, title: '⚠️ GENERAL PUBLIC WARNING', desc: 'Critical advisory issued by district authorities. Citizens requested to follow official guidance.' },
  { icon: HeartPulse, label: 'Medical Emergency', category: 'Health' as AlertCategory, priority: 'Critical' as AlertPriority, title: '🚑 MASS CASUALTY MEDICAL EMERGENCY', desc: 'Mass casualty incident declared. Emergency medical services mobilized. Citizens please make way for emergency vehicles.' },
];

type TabId = 'OVERVIEW' | 'ALERTS' | 'USERS' | 'COMPLAINTS' | 'DISASTER' | 'ANALYTICS' | 'LOGS';

const TABS: { id: TabId; label: string; icon: React.FC<any> }[] = [
  { id: 'OVERVIEW', label: 'Overview', icon: TrendingUp },
  { id: 'ALERTS', label: 'Alert Studio', icon: Megaphone },
  { id: 'USERS', label: 'User Management', icon: Users },
  { id: 'COMPLAINTS', label: 'Complaints', icon: FileSpreadsheet },
  { id: 'DISASTER', label: 'Disaster EOC', icon: ShieldAlert },
  { id: 'ANALYTICS', label: 'Analytics', icon: BarChart2 },
  { id: 'LOGS', label: 'Audit Logs', icon: ClipboardList },
];

const AdminDashboardPage: React.FC = () => {
  return (
    <AdminGuard>
      <AdminDashboardInner />
    </AdminGuard>
  );
};

const AdminDashboardInner: React.FC = () => {
  const { user } = useAuth();
  const { isEmergencyMode, activateEmergencyMode, deactivateEmergencyMode } = useEmergencyMode();
  const [activeTab, setActiveTab] = useState<TabId>('OVERVIEW');

  // Real-time state
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Alert form
  const [alertForm, setAlertForm] = useState({
    title: '', description: '', category: 'Disaster' as AlertCategory,
    priority: 'Critical' as AlertPriority, district: 'All Districts',
    isPinned: true,
  });
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState('');

  const superAdmin = isSuperAdmin(user);

  // ─── Real-time Firestore Listeners ────────────────────────────────────────
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Alerts
    unsubs.push(
      onSnapshot(query(collection(db, 'alerts'), orderBy('createdAt', 'desc')), snap => {
        setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as AlertItem)));
      }, () => {})
    );

    // Users
    unsubs.push(
      onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), snap => {
        setUsersList(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
        setLoading(false);
      }, () => { setLoading(false); })
    );

    // Complaints
    unsubs.push(
      onSnapshot(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')), snap => {
        setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {})
    );

    // Audit Logs
    unsubs.push(
      onSnapshot(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100)), snap => {
        setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
      }, () => {})
    );

    return () => unsubs.forEach(u => u());
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const logAudit = async (action: string, target: string, details?: string) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'system',
        action,
        target,
        details: details || '',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {}
  };

  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertLoading(true);
    try {
      const data: Omit<AlertItem, 'id'> = {
        ...alertForm,
        isPinned: alertForm.priority === 'Critical' ? true : alertForm.isPinned,
        status: 'ACTIVE',
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, 'alerts'), data);
      await logAudit('CREATE_ALERT', alertForm.title, `Priority: ${alertForm.priority}`);
      setAlertSuccess(true);
      setAlertForm({ title: '', description: '', category: 'Disaster', priority: 'Critical', district: 'All Districts', isPinned: true });
      setTimeout(() => setAlertSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setAlertLoading(false);
    }
  };

  const applyTemplate = (t: typeof ALERT_TEMPLATES[0]) => {
    setAlertForm(f => ({ ...f, title: t.title, description: t.desc, category: t.category, priority: t.priority }));
  };

  const deleteAlert = async (id: string, title: string) => {
    await deleteDoc(doc(db, 'alerts', id));
    await logAudit('DELETE_ALERT', title);
  };

  const togglePinAlert = async (id: string, cur: boolean) => {
    await updateDoc(doc(db, 'alerts', id), { isPinned: !cur });
  };

  const updateUserRole = async (uid: string, role: string) => {
    await updateDoc(doc(db, 'users', uid), { role });
    await logAudit('UPDATE_ROLE', uid, `Assigned ${role}`);
  };

  const toggleUserSuspension = async (uid: string, cur?: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isSuspended: !cur, accountStatus: cur ? 'ACTIVE' : 'SUSPENDED' });
    await logAudit(cur ? 'UNSUSPEND_USER' : 'SUSPEND_USER', uid);
  };

  const banUser = async (uid: string) => {
    await updateDoc(doc(db, 'users', uid), { isBanned: true, accountStatus: 'BANNED' });
    await logAudit('BAN_USER', uid);
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'complaints', id), { status });
  };

  // ─── Computed Stats ────────────────────────────────────────────────────────
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlerts = activeAlerts.filter(a => a.priority === 'Critical');
  const pendingComplaints = complaints.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS');
  const volunteers = usersList.filter(u => u.role === 'VOLUNTEER');
  const admins = usersList.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
  const filteredUsers = userSearch
    ? usersList.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    : usersList;

  const formatDate = (d: any) => {
    if (!d) return 'N/A';
    if (typeof d === 'string') return new Date(d).toLocaleString('en-IN');
    if (d?.toDate) return d.toDate().toLocaleString('en-IN');
    return new Date().toLocaleString('en-IN');
  };

  return (
    <div className={`space-y-6 ${isEmergencyMode ? 'emergency-active' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`rounded-md3 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isEmergencyMode ? 'bg-red-700 text-white' : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white'}`}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md3 bg-white/10">
              <Shield className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-yellow-300">
                  {superAdmin ? '🛡 SUPER ADMINISTRATOR' : '🔑 ADMINISTRATOR'}
                </span>
                {isEmergencyMode && (
                  <span className="bg-red-400/30 text-red-100 text-[10px] font-black px-2 py-0.5 rounded animate-pulse border border-red-400">
                    ⚡ EMERGENCY MODE ACTIVE
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold mt-0.5">MahaResilience Command & Control Center</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Maharashtra Emergency Operations Center · Real-time · {user?.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Mode Toggle */}
        <button
          onClick={isEmergencyMode ? deactivateEmergencyMode : activateEmergencyMode}
          className={`flex items-center gap-2 px-5 py-3 rounded-md3 font-bold text-sm transition-all border-2 ${
            isEmergencyMode
              ? 'bg-white text-red-700 border-white hover:bg-red-50 shadow-lg shadow-red-900/30'
              : 'bg-red-600 text-white border-red-500 hover:bg-red-700 shadow-lg shadow-red-900/40'
          }`}
        >
          {isEmergencyMode ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          {isEmergencyMode ? 'Deactivate Emergency Mode' : '⚡ Activate Emergency Mode'}
        </button>
      </div>

      {/* ── Live Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Critical Alerts', value: criticalAlerts.length, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Active Alerts', value: activeAlerts.length, icon: Bell, color: 'text-orange-600 bg-orange-50' },
          { label: 'Total Users', value: usersList.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Open Complaints', value: pendingComplaints.length, icon: FileSpreadsheet, color: 'text-amber-600 bg-amber-50' },
          { label: 'Volunteers', value: volunteers.length, icon: Award, color: 'text-green-600 bg-green-50' },
          { label: 'Admin Actions', value: auditLogs.length, icon: ClipboardList, color: 'text-purple-600 bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-md3 border border-slate-border p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2.5 rounded-md3 ${s.color.split(' ')[1]}`}>
              <s.icon className={`w-5 h-5 ${s.color.split(' ')[0]}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="flex bg-slate-100 p-1 rounded-md3 border border-slate-border gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md3 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ TAB: OVERVIEW ══════════════════════════════════ */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts */}
          <div className="bg-white rounded-md3 border border-slate-border shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Live Active Alerts
              <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded font-bold">{activeAlerts.length}</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeAlerts.length === 0 && <p className="text-slate-400 text-xs text-center py-6">No active alerts. System nominal.</p>}
              {activeAlerts.slice(0, 8).map(a => (
                <div key={a.id} className={`p-3 rounded-md3 border flex items-start gap-2 ${a.priority === 'Critical' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-border'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${a.priority === 'Critical' ? 'bg-red-600 text-white' : a.priority === 'High' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700'}`}>{a.priority}</span>
                      {a.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">{a.title}</p>
                    <p className="text-[10px] text-slate-400">{a.district} · {formatDate(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="bg-white rounded-md3 border border-slate-border shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" /> Recent Citizen Complaints
              <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded font-bold">{pendingComplaints.length} open</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {complaints.length === 0 && <p className="text-slate-400 text-xs text-center py-6">No complaints recorded.</p>}
              {complaints.slice(0, 6).map((c: any) => (
                <div key={c.id} className="p-3 rounded-md3 border border-slate-border bg-slate-50 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{c.title || 'Untitled Complaint'}</p>
                    <p className="text-[10px] text-slate-400">{c.address || c.district} · {formatDate(c.createdAt)}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${c.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {c.status || 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick User Stats */}
          <div className="bg-white rounded-md3 border border-slate-border shadow-sm p-5 lg:col-span-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" /> Platform User Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Citizens', value: usersList.filter(u => u.role === 'CITIZEN').length, color: 'bg-blue-500' },
                { label: 'Volunteers', value: volunteers.length, color: 'bg-green-500' },
                { label: 'Officials', value: usersList.filter(u => u.role === 'OFFICIAL').length, color: 'bg-purple-500' },
                { label: 'Admins', value: admins.length, color: 'bg-red-500' },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 rounded-md3 bg-slate-50 border border-slate-border">
                  <div className={`w-3 h-3 rounded-full ${s.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: ALERT STUDIO ══════════════════════════════ */}
      {activeTab === 'ALERTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Alert Form */}
          <div className="lg:col-span-2 bg-white rounded-md3 border border-slate-border shadow-sm p-5 space-y-5 h-fit">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-red-500" /> Publish New Alert
            </h3>

            {alertSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md3 text-xs font-semibold flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Alert published and routed to all Maharashtra districts in real-time.
              </div>
            )}

            {/* Templates */}
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Quick Templates</p>
              <div className="grid grid-cols-3 gap-1.5">
                {ALERT_TEMPLATES.slice(0, 6).map((t, i) => (
                  <button key={i} onClick={() => applyTemplate(t)} className="flex flex-col items-center gap-1 p-2 rounded-md3 border border-slate-border hover:border-primary hover:bg-primary-light text-xs text-slate-600 font-semibold transition-all text-center">
                    <t.icon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handlePublishAlert} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Alert Title</label>
                <input type="text" value={alertForm.title} onChange={e => setAlertForm(f => ({...f, title: e.target.value}))}
                  className="w-full px-3 py-2 rounded-md3 border border-slate-border text-xs font-semibold outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="🚨 Enter alert headline..." required />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Description & Instructions</label>
                <textarea value={alertForm.description} onChange={e => setAlertForm(f => ({...f, description: e.target.value}))}
                  rows={3} required
                  className="w-full px-3 py-2 rounded-md3 border border-slate-border text-xs font-semibold outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                  placeholder="Emergency instructions, evacuation steps, helpline numbers..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Category</label>
                  <select value={alertForm.category} onChange={e => setAlertForm(f => ({...f, category: e.target.value as AlertCategory}))}
                    className="w-full px-2 py-2 rounded border border-slate-border text-xs font-semibold outline-none">
                    {['Emergency','Disaster','Weather','Government','Health','Traffic','Community','Infrastructure'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Priority</label>
                  <select value={alertForm.priority} onChange={e => setAlertForm(f => ({...f, priority: e.target.value as AlertPriority}))}
                    className="w-full px-2 py-2 rounded border border-slate-border text-xs font-semibold outline-none">
                    <option value="Critical">🚨 Critical</option>
                    <option value="High">⚠️ High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Target District</label>
                <select value={alertForm.district} onChange={e => setAlertForm(f => ({...f, district: e.target.value}))}
                  className="w-full px-2 py-2 rounded border border-slate-border text-xs font-semibold outline-none">
                  {MAHARASHTRA_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <button type="submit" disabled={alertLoading}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-md3 flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm">
                {alertLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                Broadcast Alert to Maharashtra
              </button>
            </form>
          </div>

          {/* Active Alerts Table */}
          <div className="lg:col-span-3 bg-white rounded-md3 border border-slate-border shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Live Alert Feed ({alerts.length})
            </h3>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {alerts.length === 0 && <p className="text-slate-400 text-xs text-center py-10">No alerts published.</p>}
              {alerts.map(a => (
                <div key={a.id} className={`p-4 rounded-md3 border ${a.priority === 'Critical' ? 'bg-red-50/60 border-red-200' : 'bg-slate-50 border-slate-border'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${a.priority === 'Critical' ? 'bg-red-600 text-white' : a.priority === 'High' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700'}`}>{a.priority}</span>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">{a.category}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
                        {a.isPinned && <span className="text-[9px] bg-yellow-400 text-slate-900 font-bold px-2 py-0.5 rounded flex items-center gap-0.5"><Pin className="w-2.5 h-2.5" />Pinned</span>}
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{a.district || 'All Districts'} · {formatDate(a.createdAt)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => a.id && togglePinAlert(a.id, a.isPinned)} className="p-1.5 hover:text-amber-600 text-slate-400 rounded hover:bg-white transition-colors" title="Toggle Pin">
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => a.id && deleteAlert(a.id, a.title)} className="p-1.5 hover:text-red-600 text-slate-400 rounded hover:bg-white transition-colors" title="Delete Alert">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: USER MANAGEMENT ═══════════════════════════ */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-md3 border border-slate-border shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Citizen & User Registry ({usersList.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-md3 border border-slate-border text-xs outline-none focus:ring-2 focus:ring-primary/20 w-64"
                placeholder="Search by name or email..." />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-border bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">District</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {u.photoURL ? <img src={u.photoURL} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">{u.name?.[0] || '?'}</div>}
                        <div>
                          <p className="font-semibold text-slate-800">{u.name || 'Anonymous'}</p>
                          {u.uid === SUPER_ADMIN_UID && <span className="text-[8px] bg-yellow-400 text-slate-900 font-black px-1 rounded">🛡 SUPER ADMIN</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{u.email || u.phone || 'N/A'}</td>
                    <td className="p-3">
                      {u.uid === SUPER_ADMIN_UID ? (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 font-black px-2 py-0.5 rounded uppercase">Super Admin</span>
                      ) : (
                        <select value={u.role} onChange={e => updateUserRole(u.uid, e.target.value)}
                          className="text-[10px] px-1.5 py-1 border border-slate-border rounded font-bold uppercase bg-white">
                          <option value="CITIZEN">Citizen</option>
                          <option value="VOLUNTEER">Volunteer</option>
                          <option value="OFFICIAL">Official</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{u.district || 'Maharashtra'}</td>
                    <td className="p-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${u.isBanned ? 'bg-red-700 text-white' : u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {u.isBanned ? 'BANNED' : u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u.uid !== SUPER_ADMIN_UID && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleUserSuspension(u.uid, u.isSuspended)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold ${u.isSuspended ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          {superAdmin && !u.isBanned && (
                            <button onClick={() => banUser(u.uid)} className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-[10px] font-semibold">
                              Ban
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: COMPLAINTS ════════════════════════════════ */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white rounded-md3 border border-slate-border shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" /> Live Citizen Grievance Feed ({complaints.length})
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {complaints.length === 0 && <p className="text-slate-400 text-xs text-center py-10">No complaints submitted yet.</p>}
            {complaints.map((c: any) => (
              <div key={c.id} className="p-4 border border-slate-border rounded-md3 bg-slate-50/50">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{c.title || 'Untitled'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{c.address || c.district || 'Maharashtra'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By: {c.citizenName || 'Anonymous'} · {formatDate(c.createdAt)}</p>
                  </div>
                  <select value={c.status || 'PENDING'} onChange={e => updateComplaintStatus(c.id, e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded border border-slate-border font-bold uppercase bg-white outline-none">
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

      {/* ═══════════════════ TAB: DISASTER EOC ══════════════════════════════ */}
      {activeTab === 'DISASTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { label: 'Active Shelters', value: 24, icon: Building, color: 'bg-blue-50 text-blue-700', desc: '3 operating near capacity' },
            { label: 'Rescue Teams Deployed', value: 12, icon: Users, color: 'bg-green-50 text-green-700', desc: 'NDRF & SDRF units active' },
            { label: 'Hospitals on Alert', value: 48, icon: HeartPulse, color: 'bg-red-50 text-red-700', desc: 'Emergency wards open' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-md3 border border-slate-border shadow-sm p-5 flex items-center gap-4">
              <div className={`p-3 rounded-md3 ${s.color.split(' ')[0]}`}>
                <s.icon className={`w-6 h-6 ${s.color.split(' ')[1]}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs font-semibold text-slate-700">{s.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}

          <div className="lg:col-span-3 bg-white rounded-md3 border border-slate-border shadow-sm p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-red-500" /> District Risk Levels (Real-time)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { district: 'Raigad', risk: 'CRITICAL', color: 'border-red-400 bg-red-50' },
                { district: 'Pune', risk: 'HIGH', color: 'border-orange-400 bg-orange-50' },
                { district: 'Mumbai City', risk: 'MEDIUM', color: 'border-amber-400 bg-amber-50' },
                { district: 'Nashik', risk: 'LOW', color: 'border-green-400 bg-green-50' },
                { district: 'Thane', risk: 'HIGH', color: 'border-orange-400 bg-orange-50' },
                { district: 'Kolhapur', risk: 'CRITICAL', color: 'border-red-400 bg-red-50' },
                { district: 'Satara', risk: 'MEDIUM', color: 'border-amber-400 bg-amber-50' },
                { district: 'Nagpur', risk: 'LOW', color: 'border-green-400 bg-green-50' },
              ].map((d, i) => (
                <div key={i} className={`p-3 rounded-md3 border-2 ${d.color}`}>
                  <p className="text-xs font-bold text-slate-800">{d.district}</p>
                  <span className={`text-[9px] font-black uppercase ${d.risk === 'CRITICAL' ? 'text-red-700' : d.risk === 'HIGH' ? 'text-orange-700' : d.risk === 'MEDIUM' ? 'text-amber-700' : 'text-green-700'}`}>
                    ● {d.risk} RISK
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: ANALYTICS ═════════════════════════════════ */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { label: 'Alert Resolution Rate', value: '94.2%', sub: '+3.1% from last month', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Avg. Complaint Response', value: '2.4 hrs', sub: '-18 min from last week', icon: Clock, color: 'text-blue-600 bg-blue-50' },
            { label: 'Emergency Response Time', value: '8.2 min', sub: 'NDRF deployment average', icon: Zap, color: 'text-amber-600 bg-amber-50' },
            { label: 'Citizen Engagement', value: '87.6%', sub: 'App active user rate', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-md3 border border-slate-border shadow-sm p-6 flex items-center gap-5">
              <div className={`p-4 rounded-full ${s.color.split(' ')[1]}`}>
                <s.icon className={`w-7 h-7 ${s.color.split(' ')[0]}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{s.value}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{s.label}</p>
                <p className="text-[10px] text-slate-400 mt-1">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════ TAB: AUDIT LOGS ════════════════════════════════ */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-md3 border border-slate-border shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Admin Audit Trail ({auditLogs.length} records)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-border bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
                  <th className="p-3 text-left">Timestamp</th>
                  <th className="p-3 text-left">Admin</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Target</th>
                  <th className="p-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-400 py-8">No audit records found.</td></tr>
                )}
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="p-3 font-mono text-slate-600 truncate max-w-[100px]">
                      {log.adminId === SUPER_ADMIN_UID ? <span className="text-yellow-700 font-bold">🛡 Super Admin</span> : log.adminId?.slice(0, 8) + '...'}
                    </td>
                    <td className="p-3">
                      <span className={`font-black text-[9px] px-2 py-0.5 rounded uppercase ${
                        log.action.includes('DELETE') || log.action.includes('BAN') ? 'bg-red-100 text-red-700'
                        : log.action.includes('APPROVE') || log.action.includes('VERIFY') ? 'bg-green-100 text-green-700'
                        : log.action.includes('EMERGENCY') ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-[150px]">{log.target}</td>
                    <td className="p-3 text-slate-400">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
