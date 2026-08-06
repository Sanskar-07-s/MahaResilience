import React from 'react';
import { evaluatePasswordStrength } from '../../utils/passwordValidator.ts';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const result = evaluatePasswordStrength(password);

  const criteria = [
    { label: 'At least 8 characters', met: result.hasMinLength },
    { label: 'Upper & lowercase letters', met: result.hasLowercase && result.hasUppercase },
    { label: 'At least one number (0-9)', met: result.hasNumber },
    { label: 'Special character (!@#$%)', met: result.hasSpecialChar },
  ];

  return (
    <div className="space-y-2 mt-2 p-3 bg-slate-50 border border-slate-border rounded-md3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Password Strength:</span>
        <span className={`text-xs font-bold ${
          result.score <= 1 ? 'text-red-600' :
          result.score === 2 ? 'text-amber-600' :
          result.score === 3 ? 'text-blue-600' : 'text-green-600'
        }`}>
          {result.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 transition-all duration-300 ${
              step <= result.score ? result.color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-1 pt-1">
        {criteria.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
            {item.met ? (
              <Check className="w-3 h-3 text-green-600 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className={item.met ? 'text-slate-700 font-medium' : 'text-slate-400'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
