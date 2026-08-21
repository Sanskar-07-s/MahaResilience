import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle, XCircle, MapPin, Eye, Star, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const TourismAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [places, setPlaces] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEWS'>('PENDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPlaces = onSnapshot(collection(db, 'places'), (snap) => {
      setPlaces(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubReviews = onSnapshot(collection(db, 'placeReviews'), (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPlaces();
      unsubReviews();
    };
  }, []);

  const handleApprove = async (placeId: string, name: string) => {
    try {
      await updateDoc(doc(db, 'places', placeId), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user?.uid || 'TOURISM_ADMIN',
      });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'TOURISM_ADMIN',
        adminRole: 'MODULE_ADMIN',
        adminField: 'TOURISM',
        action: 'APPROVE_PLACE',
        module: 'TOURISM',
        targetId: placeId,
        timestamp: new Date().toISOString(),
        details: `Approved tourist destination: ${name}`,
      });
    } catch (err: any) {
      alert('Error approving place: ' + err.message);
    }
  };

  const handleReject = async (placeId: string, name: string) => {
    try {
      await updateDoc(doc(db, 'places', placeId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: user?.uid || 'TOURISM_ADMIN',
      });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'TOURISM_ADMIN',
        adminRole: 'MODULE_ADMIN',
        adminField: 'TOURISM',
        action: 'REJECT_PLACE',
        module: 'TOURISM',
        targetId: placeId,
        timestamp: new Date().toISOString(),
        details: `Rejected tourist destination: ${name}`,
      });
    } catch (err: any) {
      alert('Error rejecting place: ' + err.message);
    }
  };

  const pendingPlaces = places.filter((p) => p.status === 'pending');
  const approvedPlaces = places.filter((p) => p.status === 'approved');
  const rejectedPlaces = places.filter((p) => p.status === 'rejected');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-500/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-600/30 rounded-xl border border-teal-400/40 text-teal-300">
              <Compass className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="bg-teal-500/20 text-teal-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                SPECIALIZED ADMIN PORTAL
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Tourism Operations Center
              </h1>
              <p className="text-teal-200 text-xs mt-0.5">
                Review, Approve & Moderate Tourist Destinations across Maharashtra
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold">Pending Review</div>
            <div className="text-2xl font-black text-yellow-400 mt-1">{pendingPlaces.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold">Approved Destinations</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{approvedPlaces.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold">Rejected Submissions</div>
            <div className="text-2xl font-black text-red-400 mt-1">{rejectedPlaces.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold">Citizen Reviews</div>
            <div className="text-2xl font-black text-teal-400 mt-1">{reviews.length}</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'PENDING', label: `Pending Queue (${pendingPlaces.length})` },
            { id: 'APPROVED', label: `Approved Places (${approvedPlaces.length})` },
            { id: 'REJECTED', label: `Rejected (${rejectedPlaces.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-xl font-bold transition-all border ${
                activeTab === t.id
                  ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Pending Submissions Queue */}
        {activeTab === 'PENDING' && (
          <div className="space-y-4">
            {pendingPlaces.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                No pending tourist place submissions at this time.
              </div>
            ) : (
              pendingPlaces.map((p) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start">
                  {p.images && p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full md:w-48 h-36 object-cover rounded-xl border border-slate-800 shrink-0" />
                  ) : (
                    <div className="w-full md:w-48 h-36 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-xs shrink-0">
                      No Preview Image
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {p.category || 'Fort'}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-teal-400" /> {p.city || p.district}, {p.district}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{p.name}</h3>
                    <p className="text-slate-300 leading-relaxed line-clamp-2">{p.description}</p>
                    <div className="text-[10px] text-slate-500 pt-1">Submitted by: {p.creatorName || p.createdBy || 'Citizen User'}</div>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleApprove(p.id, p.name)}
                      className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(p.id, p.name)}
                      className="flex-1 md:flex-initial bg-red-600/80 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Approved Places View */}
        {activeTab === 'APPROVED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedPlaces.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Approved</span>
                </div>
                <p className="text-slate-400 line-clamp-2">{p.description}</p>
                <div className="text-[10px] text-slate-500">Location: {p.district} District</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
