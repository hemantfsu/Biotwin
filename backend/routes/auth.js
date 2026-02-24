const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

/**
 * Helper: generate a JWT for a user.
 */
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ────────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('age').optional().isInt({ min: 0, max: 150 }),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    body('role').optional().isIn(['patient', 'doctor']),
  ],
  async (req, res) => {
    try {
      // Validate inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ success: false, error: errors.array()[0].msg });
      }

      const { name, email, password, age, gender, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(409)
          .json({ success: false, error: 'Email already registered.' });
      }

      // Create user (password is hashed by the pre-save hook)
      const user = await User.create({
        name,
        email,
        passwordHash: password,
        age,
        gender,
        role,
      });

      const token = signToken(user);

      res.status(201).json({
        success: true,
        data: { token, user },
      });
    } catch (err) {
      console.error('Register error:', err);
      res
        .status(500)
        .json({ success: false, error: 'Registration failed.' });
    }
  }
);

// ────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ success: false, error: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      // Explicitly select passwordHash (it's hidden by default)
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, error: 'Invalid email or password.' });
      }

      const token = signToken(user);

      res.json({
        success: true,
        data: { token, user },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, error: 'Login failed.' });
    }
  }
);

// ────────────────────────────────────────────────────
// GET /api/auth/me  — get current user profile
// ────────────────────────────────────────────────────
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch profile.' });
  }
});

module.exports = router;
