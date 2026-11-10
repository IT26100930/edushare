// Reusable Auth & Security Validation Helpers

export const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'temp-mail.org',
  'throwawaymail.com',
];

export const ROLE_PREFIXES = ['admin@', 'root@', 'test@', 'no-reply@', 'noreply@', 'support@'];

export const RESERVED_USERNAMES = ['admin', 'support', 'edushare', 'moderator', 'root', 'help'];

export const COMMON_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  'qwerty123',
  'admin123',
  'edushare123',
  'student123',
  'welcome123',
];

const DOMAIN_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

export interface EmailValidationResult {
  isValid: boolean;
  isUniversity: boolean;
  status: 'empty' | 'invalid' | 'disposable' | 'role' | 'typo' | 'valid';
  message: string;
  typoSuggestion?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  const clean = email.trim().toLowerCase();
  if (!clean) {
    return { isValid: false, isUniversity: false, status: 'empty', message: '' };
  }

  // Format check
  const formatRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formatRegex.test(clean)) {
    return {
      isValid: false,
      isUniversity: false,
      status: 'invalid',
      message: 'Please enter a valid email format (e.g. name@example.com)',
    };
  }

  const [localPart, domainPart] = clean.split('@');

  // Role addresses
  for (const role of ROLE_PREFIXES) {
    if (clean.startsWith(role)) {
      return {
        isValid: false,
        isUniversity: false,
        status: 'role',
        message: 'Role addresses (admin@, root@, test@) cannot be used for personal EduShare accounts.',
      };
    }
  }

  // Disposable domains
  if (DISPOSABLE_DOMAINS.includes(domainPart)) {
    return {
      isValid: false,
      isUniversity: false,
      status: 'disposable',
      message: 'Disposable email domains are blocked to protect academic integrity.',
    };
  }

  // Typo check
  if (DOMAIN_TYPOS[domainPart]) {
    const suggested = `${localPart}@${DOMAIN_TYPOS[domainPart]}`;
    return {
      isValid: false,
      isUniversity: false,
      status: 'typo',
      message: `Did you mean ${DOMAIN_TYPOS[domainPart]}?`,
      typoSuggestion: suggested,
    };
  }

  // University domain detection
  const isUniversity =
    domainPart.endsWith('.edu') ||
    domainPart.endsWith('.ac.lk') ||
    domainPart.endsWith('.edu.lk') ||
    domainPart.endsWith('.ac.uk') ||
    domainPart.endsWith('.ac.in');

  return {
    isValid: true,
    isUniversity,
    status: 'valid',
    message: isUniversity
      ? 'Verified student university domain detected'
      : 'Personal email format confirmed',
  };
}

/** Sign-in checks only email syntax. Existing users (including admins) must be
 * allowed to authenticate; registration-only restrictions never apply here. */
export function validateLoginEmail(email: string): boolean {
  const clean = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
}

export interface PasswordRuleState {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  notCommon: boolean;
}

export function evaluatePassword(password: string): {
  rules: PasswordRuleState;
  score: number; // 0 to 4
  strengthLabel: 'Too Weak' | 'Weak' | 'Fair' | 'Strong';
} {
  const rules: PasswordRuleState = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase().trim()),
  };

  let count = 0;
  if (rules.length) count++;
  if (rules.upper && rules.lower) count++;
  if (rules.number) count++;
  if (rules.notCommon && count >= 2) count++;

  let score = 0;
  let strengthLabel: 'Too Weak' | 'Weak' | 'Fair' | 'Strong' = 'Too Weak';

  if (password.length === 0) {
    score = 0;
    strengthLabel = 'Too Weak';
  } else if (count <= 1) {
    score = 1;
    strengthLabel = 'Weak';
  } else if (count === 2) {
    score = 2;
    strengthLabel = 'Fair';
  } else if (count === 3) {
    score = 3;
    strengthLabel = 'Fair';
  } else {
    score = 4;
    strengthLabel = 'Strong';
  }

  return { rules, score, strengthLabel };
}
