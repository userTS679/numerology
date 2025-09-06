import { Router } from 'express';
import { authenticateUser, auditLog, type AuthenticatedRequest } from '../middleware/auth';
import { validatePaymentIntent, sanitizeInput } from '../middleware/validation';
import { createStripePaymentIntent, verifyPaymentStatus, PRICING } from '../services/payment';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per window
  message: { message: 'Too many payment attempts, please try again later' },
});

/**
 * POST /api/payment/create-intent
 * Create payment intent for reports or subscriptions
 */
router.post('/create-intent',
  authenticateUser,
  paymentLimiter,
  sanitizeInput,
  validatePaymentIntent,
  auditLog('create_payment_intent'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { reportType, paymentMethod, amount, currency } = req.body;
      const userId = req.user!.id;

      // Validate report type and amount
      const validReportTypes = ['detailed', 'compatibility', 'remedies'];
      if (!validReportTypes.includes(reportType)) {
        return res.status(400).json({
          message: 'Invalid report type',
          errors: [{ field: 'reportType', message: 'Must be one of: detailed, compatibility, remedies' }]
        });
      }

      // Validate amount matches report type
      const expectedAmount = PRICING.reports[reportType as keyof typeof PRICING.reports]?.amount;
      if (amount !== expectedAmount) {
        return res.status(400).json({
          message: 'Invalid amount for report type',
          errors: [{ field: 'amount', message: `Expected ${expectedAmount} for ${reportType} report` }]
        });
      }

      // Validate payment method
      const validMethods = ['stripe', 'paytm', 'upi'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          message: 'Unsupported payment method',
          errors: [{ field: 'paymentMethod', message: 'Must be one of: stripe, paytm, upi' }]
        });
      }

      let paymentIntent;

      switch (paymentMethod) {
        case 'stripe':
          paymentIntent = await createStripePaymentIntent(
            amount,
            currency || 'inr',
            {
              userId,
              reportType,
              description: `${reportType} report purchase`
            }
          );
          break;
          
        case 'paytm':
          // Mock Paytm integration
          paymentIntent = {
            id: `paytm_${Date.now()}`,
            amount,
            currency: currency || 'inr',
            status: 'pending',
            paymentUrl: `https://securegw-stage.paytm.in/order/process?orderId=paytm_${Date.now()}`
          };
          break;
          
        case 'upi':
          // Mock UPI integration
          paymentIntent = {
            id: `upi_${Date.now()}`,
            amount,
            currency: currency || 'inr',
            status: 'pending',
            upiLink: `upi://pay?pa=numencoach@paytm&pn=NumenCoach&am=${amount/100}&cu=INR&tn=${reportType} report`
          };
          break;
          
        default:
          throw new Error('Payment method not implemented');
      }

      res.json({
        paymentIntent,
        reportType,
        amount,
        currency: currency || 'inr'
      });

    } catch (error) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ 
        message: 'Payment processing failed',
        errors: [{ field: 'general', message: error.message }]
      });
    }
  }
);

/**
 * POST /api/payment/verify
 * Verify payment status
 */
router.post('/verify',
  authenticateUser,
  auditLog('verify_payment'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { paymentId, paymentMethod } = req.body;
      
      if (!paymentId || !paymentMethod) {
        return res.status(400).json({
          message: 'Payment ID and method are required'
        });
      }

      const status = await verifyPaymentStatus(paymentId, paymentMethod as any);
      
      res.json({
        paymentId,
        status: status.status,
        amount: status.amount,
        currency: status.currency
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ message: 'Payment verification failed' });
    }
  }
);

/**
 * GET /api/payment/methods
 * Get available payment methods
 */
router.get('/methods',
  async (req, res) => {
    try {
      const { getPaymentMethods } = await import('../services/payment');
      const methods = getPaymentMethods();
      
      res.json({
        methods,
        pricing: PRICING
      });

    } catch (error) {
      console.error('Payment methods fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch payment methods' });
    }
  }
);

export default router;