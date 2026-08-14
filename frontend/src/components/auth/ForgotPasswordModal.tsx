import React, { useState } from 'react';
import { sendPasswordResetLink } from '../../services/firebase/auth.service.ts';
import { getApiUrl } from '../../config/api.config.ts';
import { X, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Try Brevo REST API via backend endpoint POST /api/auth/forgot-password
      const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Password reset email sent via Brevo! Please check your inbox.');
        setEmail('');
        return;
      }

      // 2. Fallback to Firebase Client reset email
      await sendPasswordResetLink(email);
      setSuccessMessage('Password reset link sent! Check your inbox to reset your password.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-md3 border border-slate-border max-w-md w-full p-6 shadow-md3-elevation-2 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-md3 bg-primary-light text-primary">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Reset Password</h3>
            <p className="text-xs text-slate-500">Enter your email address to receive a Brevo recovery link.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-danger text-xs p-3 rounded-md3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-md3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md3 border border-slate-border text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. citizen@maharashtra.gov.in"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-primary text-white hover:bg-primary-hover rounded-md3 shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Link...' : 'Send Recovery Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
