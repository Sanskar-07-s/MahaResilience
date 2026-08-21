import React from 'react';
import { GraduationCap } from 'lucide-react';

export const EducationAdminPortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-800 to-slate-900 rounded-2xl p-6 border border-indigo-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/30 rounded-xl text-indigo-400">
              <GraduationCap className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">SPECIALIZED EDUCATION ADMIN</span>
              <h1 className="text-2xl font-black text-white mt-1">Educational Institutions & Services Center</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
