/**
 * Shared validation utilities for Karma Scrims
 * Used by both client-side forms and server-side API routes
 */

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true, message: '' };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: '' };
}

export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true, message: '' };
}

export function validateUsername(username: string): ValidationResult {
  if (!username || !username.trim()) {
    return { valid: false, message: 'Username is required' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters' };
  }
  if (trimmed.length > 20) {
    return { valid: false, message: 'Username must be 20 characters or fewer' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true, message: '' };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    // Phone is optional
    return { valid: true, message: '' };
  }
  const cleaned = phone.trim().replace(/\s|-/g, '');
  if (!/^9\d{9}$/.test(cleaned)) {
    return { valid: false, message: 'Please enter a valid Nepal phone number (10 digits starting with 9)' };
  }
  return { valid: true, message: '' };
}

export function validateName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return { valid: false, message: 'Full name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  return { valid: true, message: '' };
}
