export interface PasswordStrengthResult {
  score: number; // 0 (weak) to 4 (strong)
  label: 'Too Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string; // Tailwind color class
  hasMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const evaluatePasswordStrength = (password: string): PasswordStrengthResult => {
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasLowercase && hasUppercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  let label: PasswordStrengthResult['label'] = 'Too Weak';
  let color = 'bg-red-500';

  switch (score) {
    case 0:
    case 1:
      label = 'Weak';
      color = 'bg-red-500';
      break;
    case 2:
      label = 'Fair';
      color = 'bg-amber-500';
      break;
    case 3:
      label = 'Good';
      color = 'bg-blue-500';
      break;
    case 4:
      label = 'Strong';
      color = 'bg-green-500';
      break;
  }

  return {
    score,
    label,
    color,
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
  };
};
