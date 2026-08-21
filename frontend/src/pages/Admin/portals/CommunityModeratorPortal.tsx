import React, { useState, useEffect } from 'react';
import { Shield, Flag, CheckCircle, EyeOff, Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const CommunityModeratorPortal: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reports'), (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleHidePost = async (reportId: string, targetId: string) => {
    if (targetId) {
      try {
        await updateDoc(doc(db, 'communityPosts', targetId), { status: 'REMOVED' });
      } catch (_) {}
    }
    await updateDoc(doc(db, 'reports', reportId), { status: 'RESOLVED_HIDDEN', updatedAt: new Date().toISOString() });
    await addDoc(collection(db, 'auditLogs'), {
      adminId: user?.uid || 'MODERATOR',
      adminRole: 'COMMUNITY_MODERATOR',
      adminField: 'COMMUNITY',
      action: 'HIDE_COMMUNITY_POST',
      targetId: reportId,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDismiss = async (reportId: string) => {
    await updateDoc(doc(db, 'reports', reportId), { status: 'DISMISSED', updatedAt: new Date().toISOString() });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-rose-800 to-slate-900 rounded-2xl p-6 border border-rose-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-600/30 rounded-xl text-rose-400">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-rose-500/20 text-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">COMMUNITY MODERATOR PORTAL</span>
              <h1 className="text-2xl font-black text-white mt-1">Community Content Moderation Queue</h1>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {reports.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-sm">Reason: {r.reason || 'Spam / Misleading'}</div>
                <div className="text-slate-400">{r.description}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleHidePost(r.id, r.targetId || r.postId)} className="bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5" /> Hide Content
                </button>
                <button onClick={() => handleDismiss(r.id)} className="bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg">
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
