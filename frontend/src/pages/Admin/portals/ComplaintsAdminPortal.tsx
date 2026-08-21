import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle, XCircle, Clock, MapPin, UserCheck, Edit, Send } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const ComplaintsAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'complaints'), (snap) => {
      setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (complaintId: string, newStatus: string, officer = 'Zone Officer') => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: newStatus,
        assignedOfficer: officer,
        updatedAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'COMPLAINTS_ADMIN',
        adminRole: 'MODULE_ADMIN',
        adminField: 'COMPLAINTS',
        action: 'UPDATE_COMPLAINT_STATUS',
        module: 'COMPLAINTS',
        targetId: complaintId,
        timestamp: new Date().toISOString(),
        details: `Updated complaint status to ${newStatus}`,
      });
    } catch (_) {}
  };

  const filtered = activeStatus === 'ALL' ? complaints : complaints.filter((c) => (c.status || 'submitted').toLowerCase() === activeStatus.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-amber-800 via-orange-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-600/30 rounded-xl border border-amber-400/40 text-amber-400">
              <FileSpreadsheet className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                SPECIALIZED COMPLAINTS CASE MANAGEMENT PORTAL
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Citizen Grievance Case Center
              </h1>
              <p className="text-amber-200 text-xs mt-0.5">
                Assign Department Officers, Track Workflow Status (Submitted → Assigned → In Progress → Resolved)
              </p>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {['ALL', 'Submitted', 'Assigned', 'In_Progress', 'Resolved', 'Rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-4 py-2 rounded-xl font-bold transition-all border ${
                activeStatus === s
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Complaints Case Queue */}
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {c.category || 'CIVIC'}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> {c.ward || c.city || c.district}, {c.district}
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-sm">{c.title || c.description}</h4>
                <p className="text-slate-300">{c.description}</p>
                <div className="text-[10px] text-slate-500">Submitted: {new Date(c.createdAt || Date.now()).toLocaleString()}</div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 justify-center">
                <span className="text-[10px] font-bold uppercase text-amber-400 text-right">Status: {c.status || 'SUBMITTED'}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'assigned')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'in_progress')}
                    className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'resolved')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
