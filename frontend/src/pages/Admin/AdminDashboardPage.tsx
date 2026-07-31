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
  RefreshCw
} from 'lucide-react';
import { db } from '../../lib/firebase.ts';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

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
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Alert publishing state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDesc, setAlertDesc] = useState('');
  const [alertType, setAlertType] = useState('WEATHER');
  const [alertSeverity, setAlertSeverity] = useState('WARNING');
  const [alertRadius, setAlertRadius] = useState(5000);
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Real-time Firestore listener for all complaints
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      setLoading(false);
    }, (error) => {
      console.warn('[Admin] Firestore stream error, using REST fallback:', error);
      // REST fallback in case Firestore is unconfigured
      fetch(`${API_BASE}/api/complaints`)
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then((data) => {
          setComplaints(data.map((c: any) => ({
            ...c,
            managerNotes: c.managerNotes || '',
            citizenName: c.citizen?.name || 'Anonymous',
          })));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const docRef = doc(db, 'complaints', id);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      console.error('Firestore update failed:', err);
      // Optimistic local update fallback
      setComplaints(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNotesUpdate = async (id: string, notes: string) => {
    try {
      const docRef = doc(db, 'complaints', id);
      await updateDoc(docRef, { managerNotes: notes });
    } catch (err) {
      console.error('Notes update failed:', err);
    }
  };

  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSuccess(false);
    try {
      const response = await fetch(`${API_BASE}/api/emergency/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ch_token') || ''}`,
        },
        body: JSON.stringify({
          title: alertTitle,
          description: alertDesc,
          type: alertType,
          severity: alertSeverity,
          latitude: 18.5204,
          longitude: 73.8567,
          radius: alertRadius,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }),
      });

      if (response.ok) {
        setAlertSuccess(true);
        setAlertTitle('');
        setAlertDesc('');
        setTimeout(() => setAlertSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-400 text-white';
      case 'MEDIUM': return 'bg-yellow-400 text-slate-900';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  const unresolved = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED');

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Municipal & Official Control Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review reported grievances, route resources, publish emergency alerts, and verify community volunteer assets.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unresolved Complaints', value: unresolved.length, desc: 'Potholes, leakage, waste', icon: FileSpreadsheet, color: 'bg-red-50 text-danger' },
          { label: 'Total Complaints', value: complaints.length, desc: 'All time civic reports', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700' },
          { label: 'Volunteers Enrolled', value: 124, desc: 'Verified rescue assets', icon: Briefcase, color: 'bg-blue-50 text-blue-700' },
          { label: 'Platform Rating Avg', value: '4.8/5', desc: 'Citizen feedback satisfaction', icon: UserCheck, color: 'bg-green-50 text-green-700' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Real-time Grievance Inbox */}
        <div className="lg:col-span-2 bg-white p-6 rounded-md3 border border-slate-border shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Live Complaints Inbox
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Firestore Real-time Stream</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Inbox clean! All reported citizen issues resolved.</p>
          ) : (
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="p-4 rounded-md3 border border-slate-border bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">{complaint.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm truncate">{complaint.title}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{complaint.address}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {complaint.citizenName} · {new Date(complaint.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Status toggle dropdown */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusUpdate(complaint.id, e.target.value)}
                        disabled={updatingId === complaint.id}
                        className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-md3 border-0 cursor-pointer outline-none uppercase tracking-wider ${getStatusColor(complaint.status)} disabled:opacity-60`}
                      >
                        <option value="PENDING">⏳ Pending</option>
                        <option value="IN_PROGRESS">🔧 In Progress</option>
                        <option value="RESOLVED">✅ Resolved</option>
                        <option value="REJECTED">❌ Rejected</option>
                      </select>
                      {updatingId === complaint.id && (
                        <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                      )}
                    </div>
                  </div>

                  {complaint.photoUrl && (
                    <img
                      src={complaint.photoUrl}
                      alt="Evidence"
                      className="w-full max-h-36 object-cover rounded-md3 border border-slate-100"
                    />
                  )}

                  {/* Manager notes editor */}
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Official Notes</label>
                    <input
                      type="text"
                      defaultValue={complaint.managerNotes}
                      placeholder="Add internal notes for this complaint..."
                      onBlur={(e) => handleNotesUpdate(complaint.id, e.target.value)}
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-md3 text-slate-700 placeholder-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Emergency broadcaster form */}
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm h-fit space-y-6">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-danger" /> Broadcast Emergency Warning
          </h3>

          {alertSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md3 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Alert published and routed to all regional users.
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
                placeholder="e.g. Water Outage Pune South"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Alert Details</label>
              <textarea
                value={alertDesc}
                onChange={(e) => setAlertDesc(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-danger/20 text-xs font-semibold"
                placeholder="Describe weather warnings or infrastructure disruptions..."
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full px-2 py-2 rounded bg-white border border-slate-border outline-none text-xs font-semibold"
                >
                  <option value="WEATHER">Weather</option>
                  <option value="AQI">Air Quality</option>
                  <option value="DISASTER">Disaster/SOS</option>
                  <option value="TRAFFIC">Traffic</option>
                  <option value="OUTAGE">Power/Water Outage</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Severity</label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value)}
                  className="w-full px-2 py-2 rounded bg-white border border-slate-border outline-none text-xs font-semibold"
                >
                  <option value="INFO">Information</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical Alert</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-danger hover:bg-danger-hover text-white py-2.5 rounded-md3 font-semibold text-xs shadow-sm transition-all"
            >
              Publish Urgent Alert
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
