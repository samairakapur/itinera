import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

// Common passwords that should be blocked
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', '123456789', 'qwerty123',
  'letmein', 'welcome', 'admin123', 'iloveyou', 'sunshine',
  'princess', 'football', 'monkey123', 'shadow', 'master',
  'dragon', 'passw0rd', 'abc12345', 'trustno1', 'password1'
];

export const getPasswordRequirements = (password: string): PasswordRequirement[] => {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
};

export const isPasswordStrong = (password: string): boolean => {
  const requirements = getPasswordRequirements(password);
  const allRequirementsMet = requirements.every(req => req.met);
  const notCommonPassword = !COMMON_PASSWORDS.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
  return allRequirementsMet && notCommonPassword;
};

export const isCommonPassword = (password: string): boolean => {
  return COMMON_PASSWORDS.some(common => 
    password.toLowerCase() === common.toLowerCase() ||
    password.toLowerCase().includes(common.toLowerCase())
  );
};

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = getPasswordRequirements(password);
  const isCommon = password.length > 0 && isCommonPassword(password);
  
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Password requirements:</div>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li 
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs",
              req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3 text-destructive" />
            )}
            {req.label}
          </li>
        ))}
        <li 
          className={cn(
            "flex items-center gap-2 text-xs",
            isCommon ? "text-destructive" : password.length >= 8 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}
        >
          {isCommon ? (
            <X className="w-3 h-3" />
          ) : password.length >= 8 ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3 text-destructive" />
          )}
          Not a common password
        </li>
      </ul>
    </div>
  );
};
