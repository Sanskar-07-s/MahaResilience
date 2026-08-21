import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const ElectricityAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'electricityReports'), (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleResolve = async (id: string) => {
    await updateDoc(doc(db, 'electricityReports', id), { status: 'RESOLVED', updatedAt: new Date().toISOString() });
    await addDoc(collection(db, 'auditLogs'), {
      adminId: user?.uid || 'ELECTRICITY_ADMIN',
      adminRole: 'MODULE_ADMIN',
      adminField: 'ELECTRICITY',
      action: 'RESOLVE_OUTAGE',
      targetId: id,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-yellow-800 to-slate-900 rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-600/30 rounded-xl text-yellow-400">
              <Zap className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">SPECIALIZED ELECTRICITY ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">MSEDCL Outage & Grid Hazard Control</h1>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {reports.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-sm">{r.title || 'Transformer / Wire Hazard'}</div>
                <div className="text-slate-400">{r.district}</div>
              </div>
              <button onClick={() => handleResolve(r.id)} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg">
                Mark Grid Restored
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
