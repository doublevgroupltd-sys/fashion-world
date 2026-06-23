import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../models/Order';
import { protect, AuthRequest } from '../middleware/auth';
import { stkPush, queryStkStatus } from '../services/mpesa';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo', {
  apiVersion: '2023-10-16' as any,
});

// ── POST /api/payments/stripe/create-intent ───────────────────────────────
router.post('/stripe/create-intent', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.customer.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    if (process.env.NODE_ENV !== 'production' || !process.env.STRIPE_SECRET_KEY?.startsWith('sk_live')) {
      // Demo simulation
      console.log(`\n💳 STRIPE PAYMENT INTENT (simulated)`);
      console.log(`   Order: ${order.orderNumber}`);
      console.log(`   Amount: KES ${order.total.toLocaleString()}\n`);

      res.json({
        success: true,
        data: {
          clientSecret: 'pi_demo_secret_' + Math.random().toString(36).substr(2),
          amount: order.total,
          currency: 'kes',
          isDemo: true,
        },
      });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'kes',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: req.user._id.toString(),
      },
    });

    await Order.findByIdAndUpdate(orderId, {
      stripePaymentIntentId: paymentIntent.id,
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: order.total,
        currency: 'kes',
      },
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ success: false, message: 'Payment initialization failed.' });
  }
});

// ── POST /api/payments/stripe/confirm ─────────────────────────────────────
router.post('/stripe/confirm', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          paymentStatus: 'paid',
          paymentReference: paymentIntentId || 'demo_' + Date.now(),
          status: 'confirmed',
        },
      },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    res.json({ success: true, message: 'Payment confirmed!', data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment confirmation failed.' });
  }
});

// ── POST /api/payments/mpesa/stk-push ─────────────────────────────────────
router.post('/mpesa/stk-push', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, orderId } = req.body;

    if (!phone || !orderId) {
      res.status(400).json({ success: false, message: 'Phone number and order ID required.' });
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Normalize phone to 254XXXXXXXX format
    let normalizedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.slice(1);
    } else if (!normalizedPhone.startsWith('254')) {
      normalizedPhone = '254' + normalizedPhone;
    }

    const amount = Math.round(order.total || 0);
    const accountRef = order.orderNumber || `ORD-${order._id}`.slice(-8);

    // Call the real Daraja API
    const response = await stkPush({
      phoneNumber: normalizedPhone,
      amount,
      accountReference: accountRef,
      transactionDesc: `FashionWorld - Order ${accountRef}`,
    });

    // Save CheckoutRequestID to order for later status checks
    order.mpesaCheckoutRequestID = response.CheckoutRequestID;
    await order.save();

    console.log(`📱 M-Pesa STK push sent to ${normalizedPhone} for order ${order.orderNumber}`);

    res.json({
      success: true,
      message: `STK push sent to ${normalizedPhone}. Enter your M-Pesa PIN to complete.`,
      data: {
        checkoutRequestID: response.CheckoutRequestID,
        merchantRequestID: response.MerchantRequestID,
        responseCode: response.ResponseCode,
        customerMessage: response.CustomerMessage,
      },
    });
  } catch (error: any) {
    console.error('M-Pesa STK push error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'M-Pesa STK push failed.',
    });
  }
});

// ── GET /api/payments/mpesa/status/:checkoutRequestID ────────────────────
router.get('/mpesa/status/:checkoutRequestID', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { checkoutRequestID } = req.params;
    const { orderId } = req.query;

    if (!orderId) {
      res.status(400).json({ success: false, message: 'Order ID required.' });
      return;
    }

    // Query the real Daraja API for the status
    const status = await queryStkStatus(checkoutRequestID);

    // If payment successful, update the order
    if (status.ResultCode === '0') {
      const order = await Order.findOne({
        _id: orderId,
        mpesaCheckoutRequestID: checkoutRequestID,
      });
      if (order) {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.mpesaTransactionID = status.TransactionID || status.MerchantRequestID;
        await order.save();
        console.log(`✅ Order ${order.orderNumber} paid via M-Pesa`);
      }
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('M-Pesa status query error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check payment status.',
    });
  }
});

// ── POST /api/payments/mpesa/callback ─────────────────────────────────────
// This endpoint is called by Safaricom – no authentication required
router.post('/mpesa/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { Body } = req.body;
    console.log('M-Pesa Callback received:', JSON.stringify(Body, null, 2));

    if (!Body) {
      res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback' });
      return;
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, TransactionID } = Body.stkCallback;

    if (ResultCode === 0) {
      // Payment successful – find order by CheckoutRequestID and update
      const order = await Order.findOne({ mpesaCheckoutRequestID: CheckoutRequestID });
      if (order) {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.mpesaTransactionID = TransactionID;
        await order.save();
        console.log(`✅ Order ${order.orderNumber} paid via M-Pesa (callback)`);
      } else {
        console.warn(`⚠️ Order not found for CheckoutRequestID: ${CheckoutRequestID}`);
      }
    } else {
      console.error(`❌ M-Pesa payment failed: ${ResultDesc} (${ResultCode})`);
    }

    // Acknowledge receipt to Safaricom
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// ── POST /api/payments/stripe/webhook ─────────────────────────────────────
router.post('/stripe/webhook',
  express_raw_body,
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      res.status(400).send('Missing stripe signature');
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_demo'
      );

      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object as Stripe.PaymentIntent;
        await Order.findOneAndUpdate(
          { stripePaymentIntentId: pi.id },
          {
            $set: {
              paymentStatus: 'paid',
              paymentReference: pi.id,
              status: 'confirmed',
            },
          }
        );
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
  }
);

// Raw body parser for Stripe webhooks
function express_raw_body(req: Request, _res: Response, next: Function) {
  // In production, use express.raw({ type: 'application/json' }) before this route
  next();
}

export default router;