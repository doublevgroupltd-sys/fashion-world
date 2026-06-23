import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { protect, requireAgent, AuthRequest } from '../middleware/auth';
import nodemailer from 'nodemailer';

const router = Router();

// ── Email helper (console simulation) ─────────────────────────────────────
const sendOrderConfirmationEmail = async (order: any, customerEmail: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n📧 ORDER CONFIRMATION EMAIL (simulated)`);
    console.log(`   To: ${customerEmail}`);
    console.log(`   Order #: ${order.orderNumber}`);
    console.log(`   Total: KES ${order.total.toLocaleString()}`);
    console.log(`   Items: ${order.items.length} item(s)\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Fashion World" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Order Number: <strong>${order.orderNumber}</strong></p>
        <p>Total: <strong>KES ${order.total.toLocaleString()}</strong></p>
        <p>Status: ${order.status}</p>
        <p>We'll update you when your order ships.</p>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err);
  }
};

// ── POST /api/orders ── Create order ──────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('shippingAddress').notEmpty().withMessage('Shipping address required'),
    body('paymentMethod').isIn(['mpesa', 'card', 'cod']).withMessage('Invalid payment method'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { items, shippingAddress, paymentMethod, notes, couponCode } = req.body;

      // Validate and price-check items server-side (security)
      const enrichedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || !product.isActive) {
          res.status(400).json({
            success: false,
            message: `Product "${item.name}" is no longer available.`,
          });
          return;
        }
        if (product.totalStock < item.quantity) {
          res.status(400).json({
            success: false,
            message: `Insufficient stock for "${product.name}". Only ${product.totalStock} left.`,
          });
          return;
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        enrichedItems.push({
          product: product._id,
          name: product.name,
          image: product.images[0] || '',
          price: product.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          subtotal: itemTotal,
        });
      }

      // Shipping & tax
      const shippingCost = subtotal >= 5000 ? 0 : 300; // Free shipping over KES 5000
      const tax = Math.round(subtotal * 0.16); // 16% VAT Kenya
      const total = subtotal + shippingCost + tax;

      const order = await Order.create({
        customer: req.user?._id,
        items: enrichedItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingCost,
        tax,
        total,
        notes,
        couponCode,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      });

      // Decrement stock
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { totalStock: -item.quantity, soldCount: item.quantity },
        });
      }

      // Update customer total spent (for paid orders)
      if (paymentMethod === 'cod') {
        await User.findByIdAndUpdate(req.user?._id, {
          $inc: { totalSpent: total },
        });
      }

      await sendOrderConfirmationEmail(order, req.user?.email || shippingAddress.email);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        data: { order },
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
    }
  }
);

// ── GET /api/orders ── Agent: all orders | Consumer: own orders ───────────
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // Non-agents only see their own orders
    if (req.user?.role !== 'agent') {
      filter.customer = req.user?._id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (req.query.sort === 'oldest') sort = { createdAt: 1 };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('customer', 'firstName lastName email phone')
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// ── GET /api/orders/analytics ── Agent only ───────────────────────────────
router.get('/analytics', protect, requireAgent, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayOrders,
      monthRevenue,
      pendingOrders,
      totalCustomers,
      recentOrders,
      last7DaysSales,
      lowStockProducts,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'consumer' }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customer', 'firstName lastName email')
        .lean(),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Product.find({ totalStock: { $lt: 5 }, isActive: true })
        .select('name totalStock images')
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          todayOrders,
          monthRevenue: monthRevenue[0]?.total || 0,
          pendingOrders,
          totalCustomers,
        },
        recentOrders,
        last7DaysSales,
        lowStockProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.product', 'name images price');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Security: consumers can only see their own orders
    if (
      req.user?.role !== 'agent' &&
      order.customer._id.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
});

// ── PATCH /api/orders/:id/status ── Agent only ────────────────────────────
router.patch(
  '/:id/status',
  protect,
  requireAgent,
  [body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, cancelReason, trackingNumber } = req.body;

      const updates: Record<string, unknown> = { status };
      if (status === 'cancelled') {
        updates.cancelledAt = new Date();
        if (cancelReason) updates.cancelReason = cancelReason;
      }
      if (status === 'delivered') {
        updates.deliveredAt = new Date();
        updates.paymentStatus = 'paid';
      }
      if (trackingNumber) updates.trackingNumber = trackingNumber;

      const order = await Order.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
        .populate('customer', 'firstName lastName email');

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      // If delivered, update customer totalSpent for COD orders
      if (status === 'delivered' && order.paymentMethod === 'cod') {
        await User.findByIdAndUpdate(order.customer._id, {
          $inc: { totalSpent: order.total },
        });
      }

      res.json({ success: true, message: `Order status updated to ${status}.`, data: { order } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update order status.' });
    }
  }
);

// ── PATCH /api/orders/:id/payment ── Internal / webhook ───────────────────
router.patch('/:id/payment', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentStatus, paymentReference } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          paymentStatus,
          ...(paymentReference && { paymentReference }),
          ...(paymentStatus === 'paid' && { status: 'confirmed' }),
        },
      },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (paymentStatus === 'paid') {
      await User.findByIdAndUpdate(order.customer, { $inc: { totalSpent: order.total } });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment update failed.' });
  }
});

export default router;
