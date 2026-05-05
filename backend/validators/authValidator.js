//http://express-validator.github.io/docs/guides/getting-started - add to attributions

// backend/validators/authValidator.js
import { body, validationResult } from 'express-validator';

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,  // first error
      code: 'VALIDATION_ERROR',
      details: errors.array(),         // all errors, for debugging
    });
  }
  next();
};

export const validateSignup = [
  body('email')
  .isEmail()
  .withMessage('Valid email required')
  .normalizeEmail(),

  body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters'),

  body('company_name')
  .trim()
  .notEmpty()
  .withMessage('Company name is required'),

  body('company_address')
  .trim()
  .notEmpty()
  .withMessage('Company address is required'),

  body('uen')
  .trim()
  .notEmpty()
  .isNumeric()
  .withMessage('UEN is required'),

  body('contact_number')
  .trim()
  .notEmpty()
  .withMessage('Contact number is required'),

  handleValidation,
];

export const validateLogin = [
  body('email')
  .isEmail()
  .withMessage('Valid email required'),

  body('password')
  .notEmpty()
  .withMessage('Password required'),
  
  handleValidation,
];