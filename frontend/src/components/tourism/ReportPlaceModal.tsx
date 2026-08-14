import React, { useState } from 'react';
import { X, AlertTriangle, Send, ShieldCheck, RefreshCw } from 'lucide-react';
import { submitPlaceReport } from '../../services/tourismService.ts';
import { RecaptchaWidget } from '../security/RecaptchaWidget.tsx';

interface ReportPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
}

export const ReportPlaceModal: React.FC<ReportPlaceModalProps> = ({
  isOpen,
  onClose,
  placeId,
  placeName,
}) => {
  const [reason, setReason] = useState('Wrong Location');
  const [description, setDescription] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    try {
      const res = await submitPlaceReport(placeId, { reason, description });
      if (res.success) {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base leading-snug">Report Location Info</h3>
            <p className="text-xs text-slate-500 truncate">{placeName}</p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-center space-y-2">
            <div className="font-extrabold text-sm">Thank You for Improving MahaResilience!</div>
            <p className="text-xs text-emerald-700">
              Your report has been submitted to platform moderators for verification.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Wrong Location">📍 Incorrect Coordinates / Wrong Location</option>
                <option value="Closed / Removed">🔒 Place Permanently Closed / Removed</option>
                <option value="Duplicate Place">👯 Duplicate Entry</option>
                <option value="Inappropriate Content">⚠️ Offensive or Inappropriate Content</option>
                <option value="Wrong Information">📝 Outdated / Wrong Timings or Details</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue to help moderators update this listing..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <RecaptchaWidget onVerify={(t) => setRecaptchaToken(t)} />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
