import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';

export const GovernmentAdminPortal: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'schemes'), (snap) => setSchemes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-purple-800 to-slate-900 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/30 rounded-xl text-purple-400">
              <Landmark className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">SPECIALIZED GOVERNMENT ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">Maharashtra Welfare Schemes Operations</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
