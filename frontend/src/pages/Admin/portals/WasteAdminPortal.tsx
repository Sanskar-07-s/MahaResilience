import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const WasteAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'wastePickups'), (snap) => setPickups(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleResolve = async (id: string) => {
    await updateDoc(doc(db, 'wastePickups', id), { status: 'RESOLVED', updatedAt: new Date().toISOString() });
    await addDoc(collection(db, 'auditLogs'), {
      adminId: user?.uid || 'WASTE_ADMIN',
      adminRole: 'MODULE_ADMIN',
      adminField: 'WASTE',
      action: 'RESOLVE_PICKUP',
      targetId: id,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/30 rounded-xl text-emerald-400">
              <Trash2 className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">SPECIALIZED WASTE ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">Municipal Sanitation & Pickup Operations</h1>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {pickups.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-sm">{p.type || 'Bulk Garbage Pickup'}</div>
                <div className="text-slate-400">{p.district}</div>
              </div>
              <button onClick={() => handleResolve(p.id)} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg">
                Mark Collected
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
