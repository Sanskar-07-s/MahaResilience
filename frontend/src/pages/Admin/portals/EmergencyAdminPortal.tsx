import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Plus, X, Radio, MapPin, CheckCircle, Clock, Volume2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import { DisasterAlert } from '../../../contexts/AlertContext.tsx';

export const EmergencyAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('CRITICAL');
  const [category, setCategory] = useState('FLOOD');
  const [district, setDistrict] = useState('Kolhapur');
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(35);
  const [scope, setScope] = useState<'DISTRICT' | 'CITY' | 'WARD' | 'STATEWIDE'>('DISTRICT');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'alerts'), (snap) => {
      const list: DisasterAlert[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DisasterAlert));
      setAlerts(list);
    });
    return () => unsub();
  }, []);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);

    try {
      const alertObj = {
        title: title.trim(),
        description: description.trim(),
        severity,
        category,
        state: 'MAHARASHTRA',
        district,
        city: city || district,
        radiusKm,
        scope,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        publishedDate: new Date().toISOString(),
        createdBy: user?.uid || 'EMERGENCY_ADMIN',
        officialLink: 'https://sachet.ndma.gov.in',
      };

      const docRef = await addDoc(collection(db, 'alerts'), alertObj);

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'EMERGENCY_ADMIN',
        adminRole: 'MODULE_ADMIN',
        adminField: 'EMERGENCY',
        action: 'CREATE_ALERT',
        module: 'EMERGENCY',
        targetId: docRef.id,
        timestamp: new Date().toISOString(),
        details: `Created ${severity} Alert for ${district}`,
      });

      setTitle('');
      setDescription('');
      setShowCreateModal(false);
    } catch (err: any) {
      alert('Failed to create alert: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpire = async (alertId: string) => {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'EXPIRED',
        updatedAt: new Date().toISOString(),
      });
    } catch (_) {}
  };

  const activeAlerts = alerts.filter((a) => a.status !== 'EXPIRED');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 via-rose-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/30 rounded-xl border border-red-400/40 text-red-400">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                SPECIALIZED EMERGENCY ADMIN PORTAL
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Disaster Emergency Operations Center (EOC)
              </h1>
              <p className="text-red-200 text-xs mt-0.5">
                Issue Location-Scoped Disaster Bulletins & Manage Statewide Emergency Alerts
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg hover-scale text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Issue Disaster Bulletin
          </button>
        </div>

        {/* Active Emergency Bulletins Queue */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" /> Active Broadcast Bulletins ({activeAlerts.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((a) => (
              <div key={a.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
                    {a.severity} • {a.category}
                  </span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" /> {a.district || 'All Districts'}
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-sm">{a.title}</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{a.description}</p>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                  <span>Scope: {a.scope || 'DISTRICT'} ({a.radiusKm || 35} km radius)</span>
                  <button
                    onClick={() => a.id && handleExpire(a.id)}
                    className="text-red-400 font-bold hover:underline"
                  >
                    Mark Expired
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Bulletin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Create Location-Scoped Emergency Alert</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Alert Headline</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="RED ALERT: Panchganga Flood Discharge Warning"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Detailed Evacuation Instructions</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="River level crossed danger mark. Evacuate low-lying river areas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Severity Level</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="CRITICAL">CRITICAL (Full Banner Overlay)</option>
                      <option value="HIGH">HIGH (Advisory Banner)</option>
                      <option value="MEDIUM">MEDIUM (Notification Drawer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target District</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
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
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl transition-all text-xs shadow-lg mt-2 disabled:opacity-50"
                >
                  {submitting ? 'Publishing Alert...' : 'Publish Disaster Bulletin'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
