// Shared validation utilities for frontend and backend consistency

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

// Password validation - consistent with backend
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): EmailValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Username validation
export const validateUsername = (username: string): UsernameValidationResult => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3 || username.length > 20) {
    return { isValid: false, error: 'Username must be between 3 and 20 characters' };
  }
  
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username must contain only letters, numbers, and underscores' };
  }
  
  return { isValid: true };
};

// Full name validation
export const validateFullName = (fullName: string): { isValid: boolean; error?: string } => {
  if (!fullName) {
    return { isValid: false, error: 'Full name is required' };
  }
  
  if (fullName.length < 2 || fullName.length > 100) {
    return { isValid: false, error: 'Full name must be between 2 and 100 characters' };
  }
  
  return { isValid: true };
};

// Login input validation (email or username)
export const validateLoginInput = (input: string): { isValid: boolean; error?: string; type: 'email' | 'username' | 'invalid' } => {
  if (!input) {
    return { isValid: false, error: 'Email or username is required', type: 'invalid' };
  }
  
  const isEmail = input.includes('@');
  const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(input);
  
  if (isEmail) {
    const emailValidation = validateEmail(input);
    return {
      isValid: emailValidation.isValid,
      ...(emailValidation.error && { error: emailValidation.error }),
      type: 'email'
    };
  } else if (isUsername) {
    return {
      isValid: true,
      type: 'username'
    };
  } else {
    return {
      isValid: false,
      error: 'Please enter a valid email address or username',
      type: 'invalid'
    };
  }
};
