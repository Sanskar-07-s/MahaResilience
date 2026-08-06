import React, { useState, useEffect, useRef } from 'react';
import { setupRecaptcha, sendPhoneOTP, verifyPhoneOTP } from '../../services/firebase/auth.service.ts';
import { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { Phone, RefreshCw, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface PhoneOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const MAX_ATTEMPTS = 3;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 30; // 30 seconds

export const PhoneOTPModal: React.FC<PhoneOTPModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'INPUT_PHONE' | 'ENTER_OTP'>('INPUT_PHONE');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // OTP inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timers & Attempt Locks
  const [resendTimer, setResendTimer] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(OTP_EXPIRY_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Loading & Alerts
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle countdown timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'ENTER_OTP' && expiryTimer > 0 && !isLocked) {
      interval = setInterval(() => {
        setExpiryTimer((prev) => {
          if (prev <= 1) {
            setError('OTP expired. Please request a new code.');
            setIsLocked(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, expiryTimer, isLocked]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Format phone number to E.164
    let formatted = phoneNumber.trim();
    if (!formatted.startsWith('+')) {
      formatted = `+91${formatted.replace(/^0+/, '')}`;
    }

    if (formatted.length < 12) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSending(true);

    try {
      // 1. Try Backend Express endpoint /api/auth/send-otp (Twilio Node SDK)
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('ENTER_OTP');
        setExpiryTimer(data.expiresIn || OTP_EXPIRY_SECONDS);
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setAttempts(0);
        setIsLocked(false);
        setSuccessMsg(`Twilio OTP sent to ${formatted}`);
        return;
      }

      if (!response.ok && response.status === 429) {
        throw new Error(data.error || 'Rate limit exceeded. Please wait before retrying.');
      }

      // If backend offline or missing, fall back to Firebase Client Auth reCAPTCHA OTP
      throw new Error(data.error || 'Backend Twilio endpoint unavailable, falling back to Firebase reCAPTCHA...');
    } catch (backendErr: any) {
      console.warn('[Twilio OTP Fallback]:', backendErr.message);

      try {
        const verifier = setupRecaptcha('recaptcha-container');
        const result = await sendPhoneOTP(formatted, verifier);

        setConfirmationResult(result);
        setStep('ENTER_OTP');
        setExpiryTimer(OTP_EXPIRY_SECONDS);
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setAttempts(0);
        setIsLocked(false);
        setSuccessMsg(`Firebase OTP sent to ${formatted}`);
      } catch (fbErr: any) {
        setError(fbErr.message || backendErr.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (isLocked) return;
    const cleanValue = value.replace(/[^0-9]/g, '');

    const newOtp = [...otpDigits];
    newOtp[index] = cleanValue.slice(-1);
    setOtpDigits(newOtp);

    // Auto focus next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');

    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setIsLocked(true);
      setError('Maximum 3 verification attempts reached. Please request a new OTP.');
      return;
    }

    setError(null);
    setIsVerifying(true);

    let formatted = phoneNumber.trim();
    if (!formatted.startsWith('+')) {
      formatted = `+91${formatted.replace(/^0+/, '')}`;
    }

    try {
      // 1. Try Backend verification endpoint /api/auth/verify-otp
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted, otp: otpCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('Phone verified successfully!');
        login(data.token, data.user);

        setTimeout(() => {
          onSuccess(data.user);
          onClose();
        }, 600);
        return;
      }

      // If backend verification returned an error
      if (!response.ok && !confirmationResult) {
        throw new Error(data.error || 'Invalid OTP verification');
      }

      // 2. Fallback to Firebase Client verification
      if (confirmationResult) {
        const user = await verifyPhoneOTP(confirmationResult, otpCode);
        setSuccessMsg('Phone number verified via Firebase!');

        setTimeout(() => {
          onSuccess(user);
          onClose();
        }, 600);
      } else {
        throw new Error(data.error || 'Invalid OTP verification');
      }
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setError('Maximum 3 verification attempts reached. Please request a new OTP.');
      } else {
        setError(err.message || `Invalid OTP code. Attempt ${newAttempts} of ${MAX_ATTEMPTS}.`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      {/* Invisible reCAPTCHA Container */}
      <div id="recaptcha-container"></div>

      <div className="bg-white rounded-md3 border border-slate-border max-w-md w-full p-6 shadow-md3-elevation-2 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-md3 bg-primary-light text-primary">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Phone OTP Verification</h3>
            <p className="text-xs text-slate-500">Secure SMS login via Twilio & Firebase</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-danger text-xs p-3 rounded-md3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-md3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'INPUT_PHONE' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Mobile Phone Number</label>
              <div className="flex gap-2">
                <span className="px-3 py-2.5 bg-slate-100 border border-slate-border rounded-md3 text-sm font-bold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md3 border border-slate-border text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="98765 43210"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-primary text-white font-semibold rounded-md3 hover:bg-primary-hover transition-all text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating & Sending OTP...
                </>
              ) : (
                'Send Verification OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2 text-center">
              <label className="text-xs font-semibold text-slate-600 block">
                Enter 6-Digit OTP Code
              </label>

              {/* 6 Digit PIN Boxes */}
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isLocked || isVerifying}
                    className="w-10 h-12 text-center text-lg font-bold border border-slate-border rounded-md3 focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:bg-slate-100"
                  />
                ))}
              </div>

              {/* Expiry & Attempts Status */}
              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 px-1">
                <span>Expires in: <strong className="text-slate-800">{formatSeconds(expiryTimer)}</strong></span>
                <span>Attempts: <strong className={attempts >= 2 ? 'text-danger' : 'text-slate-800'}>{attempts}/{MAX_ATTEMPTS}</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || isLocked || otpDigits.join('').length !== 6}
              className="w-full py-3 bg-primary text-white font-semibold rounded-md3 hover:bg-primary-hover transition-all text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Log In'
              )}
            </button>

            {/* Resend Option */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setStep('INPUT_PHONE')}
                className="text-slate-500 hover:text-slate-800"
              >
                Change Phone Number
              </button>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={resendTimer > 0 || isSending}
                className="text-primary font-semibold hover:underline disabled:text-slate-300 disabled:no-underline"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
