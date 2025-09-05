import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Handle validation errors
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

/**
 * Validate user registration
 */
export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\u0900-\u097F]+$/)
    .withMessage('Full name must be 2-100 characters, letters only'),
  
  body('dateOfBirth')
    .isISO8601()
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    }),
  
  body('timeOfBirth')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  
  body('placeOfBirth')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Place of birth is required'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('dataConsent')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('Data consent is required');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validate user login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validate profile update
 */
export const validateProfileUpdate = [
  body('maritalStatus')
    .optional()
    .isIn(['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'])
    .withMessage('Invalid marital status'),
  
  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Occupation must be less than 200 characters'),
  
  body('careerStage')
    .optional()
    .isIn(['student', 'early_career', 'mid_career', 'senior_career', 'retired', 'entrepreneur'])
    .withMessage('Invalid career stage'),
  
  body('mainConcerns')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Main concerns must be an array with max 5 items'),
  
  body('lifeGoals')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Life goals must be an array with max 10 items'),
  
  body('language')
    .optional()
    .isIn(['hi', 'en', 'hi-en'])
    .withMessage('Invalid language preference'),
  
  handleValidationErrors
];

/**
 * Validate compatibility analysis request
 */
export const validateCompatibilityRequest = [
  body('partner2Name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Partner name is required'),
  
  body('partner2DateOfBirth')
    .isISO8601()
    .withMessage('Valid date of birth is required'),
  
  body('partner2TimeOfBirth')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  
  body('partner2PlaceOfBirth')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Place of birth is required'),
  
  handleValidationErrors
];

/**
 * Sanitize input data
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Remove any potential XSS or injection attempts
  function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  }

  req.body = sanitizeValue(req.body);
  next();
}

export default router;