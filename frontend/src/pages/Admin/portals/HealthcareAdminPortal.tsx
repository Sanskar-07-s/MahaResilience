import React, { useState, useEffect } from 'react';
import { HeartPulse, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const HealthcareAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'hospitals'), (snap) => setHospitals(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleVerify = async (id: string) => {
    await updateDoc(doc(db, 'hospitals', id), { isVerified: true, updatedAt: new Date().toISOString() });
    await addDoc(collection(db, 'auditLogs'), {
      adminId: user?.uid || 'HEALTHCARE_ADMIN',
      adminRole: 'MODULE_ADMIN',
      adminField: 'HEALTHCARE',
      action: 'VERIFY_FACILITY',
      targetId: id,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-red-800 to-slate-900 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/30 rounded-xl text-red-400">
              <HeartPulse className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">SPECIALIZED HEALTHCARE ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">Healthcare Facilities & Verification Queue</h1>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {hospitals.map((h) => (
            <div key={h.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-sm">{h.name || 'District Hospital'}</div>
                <div className="text-slate-400">{h.district}</div>
              </div>
              <button onClick={() => handleVerify(h.id)} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg">
                Verify Facility
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
