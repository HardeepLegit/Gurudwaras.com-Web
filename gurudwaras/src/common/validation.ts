import { ValidationError } from './errors';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class Validator {
  static validate(data: any, schema: ValidationSchema): void {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rules);
      errors.push(...fieldErrors);
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  private static validateField(field: string, value: any, rules: ValidationRule): string[] {
    const errors: string[] = [];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return errors; // Skip other validations if required field is missing
    }

    // Skip other validations if value is not provided and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type check
    if (rules.type && !this.checkType(value, rules.type)) {
      errors.push(`${field} must be of type ${rules.type}`);
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`);
      }
    }

    return errors;
  }

  private static checkType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const commonSchemas = {
  gurudwara: {
    name: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    emailId: { 
      type: 'string' as const, 
      custom: (value: string) => !value || Validator.validateEmail(value) || 'Invalid email format'
    },
    phoneMobile: { 
      type: 'string' as const,
      custom: (value: string) => !value || Validator.validatePhone(value) || 'Invalid phone format'
    },
    website: { 
      type: 'string' as const,
      custom: (value: string) => !value || Validator.validateUrl(value) || 'Invalid URL format'
    },
    latitude: { type: 'number' as const },
    longitude: { type: 'number' as const },
    address: { required: true, type: 'string' as const, minLength: 5 },
    city: { required: true, type: 'string' as const, minLength: 2 },
    state: { required: true, type: 'string' as const, minLength: 2 },
    country: { required: true, type: 'string' as const, minLength: 2 },
  }
};