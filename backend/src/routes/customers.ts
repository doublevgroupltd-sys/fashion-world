import { Router, Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import { protect, requireAgent, generateToken, sendTokenCookie, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require agent role
router.use(protect, requireAgent);

// ── GET /api/customers ────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.role = req.query.role;

    if (req.query.search) {
      const regex = new RegExp(req.query.search as string, 'i');
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
});

// ── GET /api/customers/:id ────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await User.findById(req.params.id).select('-password').lean();
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    const orders = await Order.find({ customer: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const stats = await Order.aggregate([
      { $match: { customer: customer._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        customer,
        orders,
        stats: stats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch customer.' });
  }
});

// ── POST /api/customers/:id/impersonate ── Demo-safe impersonation ────────
router.post('/:id/impersonate', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    // Generate a short-lived token for the customer
    const token = generateToken(customer._id.toString(), customer.role);

    // Log the impersonation (audit trail)
    console.log(`🔍 IMPERSONATION: Agent ${req.user?.email} impersonated user ${customer.email} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: `Now viewing as ${customer.fullName}`,
      data: {
        user: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          role: customer.role,
        },
        token,
        isImpersonating: true,
        originalAgent: req.user?.email,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Impersonation failed.' });
  }
});

// ── PATCH /api/customers/:id/toggle-active ────────────────────────────────
router.patch('/:id/toggle-active', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    customer.isActive = !customer.isActive;
    await customer.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Account ${customer.isActive ? 'activated' : 'deactivated'}.`,
      data: { isActive: customer.isActive },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update customer.' });
  }
});

export default router;
