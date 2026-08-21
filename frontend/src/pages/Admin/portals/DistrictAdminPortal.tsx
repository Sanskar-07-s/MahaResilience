import React, { useState, useEffect } from 'react';
import { MapPin, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const DistrictAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const districtName = user?.district || 'Kolhapur';
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'complaints'), (snap) => {
      const distData = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c: any) => (c.district || '').toLowerCase() === districtName.toLowerCase());
      setComplaints(distData);
    });
    return () => unsub();
  }, [districtName]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-amber-800 to-slate-900 rounded-2xl p-6 border border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-600/30 rounded-xl text-amber-400">
              <MapPin className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">GEOGRAPHICALLY SCOPED DISTRICT ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">{districtName} District Operations Center</h1>
              <p className="text-amber-200 text-xs mt-0.5">Restricted to authorized complaints and civic operations in {districtName} District ONLY</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <h3 className="font-extrabold text-white text-sm">Complaints in {districtName} ({complaints.length})</h3>
          {complaints.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-sm">{c.title || c.description}</div>
                <div className="text-slate-400">{c.ward || c.city || c.district}</div>
              </div>
              <span className="text-amber-400 font-bold uppercase">{c.status || 'SUBMITTED'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
