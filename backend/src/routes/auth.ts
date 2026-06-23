import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import {
  generateToken,
  sendTokenCookie,
  protect,
  AuthRequest,
} from '../middleware/auth';
// TEMPORARY FIX: remove authLimiter import
// import { authLimiter } from '../index';

const router = Router();

// Dummy middleware to replace authLimiter (no rate limiting for now)
const noLimiter = (req: Request, res: Response, next: any) => next();

// ── Validation helpers ─────────────────────────────────────────────────────
const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const handleValidation = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: (e as any).path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// ── POST /api/auth/register/consumer ─────────────────────────────────────
router.post(
  '/register/consumer',
  noLimiter, // was authLimiter
  registerValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (!handleValidation(req, res)) return;

    try {
      const { firstName, lastName, email, password, phone } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        role: 'consumer',
      });

      const token = generateToken(user._id.toString(), user.role);
      sendTokenCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Consumer register error:', error);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
);

// ── POST /api/auth/register/agent ─────────────────────────────────────────
router.post(
  '/register/agent',
  noLimiter, // was authLimiter
  [
    ...registerValidation,
    body('inviteCode').notEmpty().withMessage('Invite code is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    if (!handleValidation(req, res)) return;

    try {
      const { firstName, lastName, email, password, phone, inviteCode } = req.body;

      // Validate invite code
      if (inviteCode !== process.env.AGENT_INVITE_CODE) {
        res.status(403).json({ success: false, message: 'Invalid invite code.' });
        return;
      }

      const existing = await User.findOne({ email });
      if (existing) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        role: 'agent',
      });

      const token = generateToken(user._id.toString(), user.role);
      sendTokenCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Agent account created successfully!',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Agent register error:', error);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post(
  '/login',
  noLimiter, // was authLimiter
  loginValidation,
  async (req: Request, res: Response): Promise<void> => {
    if (!handleValidation(req, res)) return;

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.isActive) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user._id.toString(), user.role);
      sendTokenCookie(res, token);

      res.json({
        success: true,
        message: 'Welcome back!',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
  }
);

// ── POST /api/auth/logout ─────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate('wishlist', 'name images price');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          wishlist: user.wishlist,
          totalSpent: user.totalSpent,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────
router.put(
  '/profile',
  protect,
  [
    body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
    body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
    body('phone').optional().trim(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!handleValidation(req, res)) return;

    try {
      const allowedFields = ['firstName', 'lastName', 'phone', 'address'];
      const updates: Record<string, unknown> = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({ success: true, message: 'Profile updated.', data: { user } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Profile update failed.' });
    }
  }
);

// ── PUT /api/auth/change-password ─────────────────────────────────────────
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!handleValidation(req, res)) return;

    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user?._id).select('+password');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Password change failed.' });
    }
  }
);

// ── POST /api/auth/wishlist/toggle ────────────────────────────────────────
router.post('/wishlist/toggle', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ success: false, message: 'Product ID required.' });
      return;
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const idx = user.wishlist.findIndex((id) => id.toString() === productId);
    let action: string;
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      action = 'removed';
    } else {
      user.wishlist.push(new (require('mongoose').Types.ObjectId)(productId));
      action = 'added';
    }

    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `Product ${action} from wishlist.`, data: { wishlist: user.wishlist } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Wishlist update failed.' });
  }
});

export default router;