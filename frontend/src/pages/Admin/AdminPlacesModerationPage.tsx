import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, MapPin, RefreshCw, AlertCircle, Eye, ArrowLeft } from 'lucide-react';
import { fetchPendingPlaces, moderatePlaceSubmission, TouristPlace } from '../../services/tourismService.ts';

export const AdminPlacesModerationPage: React.FC = () => {
  const navigate = useNavigate();
  const [pendingPlaces, setPendingPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    const data = await fetchPendingPlaces();
    setPendingPlaces(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleModerate = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const res = await moderatePlaceSubmission(id, action);
    if (res.success) {
      setActionMessage(`Place ${action.toLowerCase()}d successfully.`);
      setPendingPlaces((prev) => prev.filter((p) => p.id !== id));
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Command Center
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-800 font-extrabold text-xs rounded-xl border border-teal-200">
          <ShieldCheck className="w-4 h-4 text-teal-600" /> Super Admin Tourism Moderation
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between border border-slate-800">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black">Community Places Moderation Queue</h1>
          <p className="text-xs text-teal-200">
            Review user-contributed tourist attractions before publishing publicly to MahaResilience.
          </p>
        </div>

        <button
          onClick={loadPending}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {actionMessage}
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : pendingPlaces.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
          <div className="font-extrabold text-slate-800 text-base">Moderation Queue is Clear!</div>
          <p className="text-xs text-slate-500">There are currently no pending user submissions to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPlaces.map((place) => (
            <div
              key={place.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start justify-between gap-4"
            >
              <div className="flex gap-4 items-start">
                <img
                  src={
                    place.images?.[0] ||
                    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt={place.name}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
                />

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug">{place.name}</h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg uppercase">
                      {place.category}
                    </span>
                  </div>

                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{place.description}</p>

                  <div className="pt-1 flex items-center gap-3 text-slate-500 font-medium text-[11px]">
                    <span>📍 {place.address}</span>
                    <span>•</span>
                    <span>Contributor: {place.createdByName || 'Citizen'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleModerate(place.id, 'APPROVE')}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Verify
                </button>

                <button
                  onClick={() => handleModerate(place.id, 'REJECT')}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Reject Entry
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
