import React, { useState, useEffect } from 'react';
import { Droplet, CheckCircle, Clock, MapPin, Truck } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const WaterAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'waterRequests'), (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleResolve = async (id: string) => {
    await updateDoc(doc(db, 'waterRequests', id), { status: 'RESOLVED', updatedAt: new Date().toISOString() });
    await addDoc(collection(db, 'auditLogs'), {
      adminId: user?.uid || 'WATER_ADMIN',
      adminRole: 'MODULE_ADMIN',
      adminField: 'WATER',
      action: 'RESOLVE_WATER_REQUEST',
      targetId: id,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-800 to-slate-900 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/30 rounded-xl text-blue-400">
              <Droplet className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">SPECIALIZED WATER ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">Water Supply & Municipal Tanker Operations</h1>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {requests.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-sm">{r.title || 'Water Tanker Booking'}</div>
                <div className="text-slate-400">{r.address || r.district}</div>
              </div>
              <button onClick={() => handleResolve(r.id)} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg">
                Mark Tanker Dispatched
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
