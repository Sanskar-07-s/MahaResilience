import React from 'react';
import { Bus } from 'lucide-react';

export const TransportAdminPortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-cyan-800 to-slate-900 rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-600/30 rounded-xl text-cyan-400">
              <Bus className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">SPECIALIZED TRANSPORT ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">Transit & EV Infrastructure Operations</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
