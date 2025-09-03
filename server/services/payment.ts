import Stripe from 'stripe';
import crypto from 'crypto';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'test_key' ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : {
  // Mock Stripe for testing
  paymentIntents: {
    create: async (params: any) => ({
      id: 'pi_test_' + Math.random().toString(36).substr(2, 9),
      amount: params.amount,
      currency: params.currency,
      status: 'requires_payment_method',
      client_secret: 'pi_test_client_secret'
    }),
    retrieve: async (id: string) => ({
      id,
      status: 'succeeded',
      amount: 29900,
      currency: 'inr'
    })
  },
  subscriptions: {
    create: async (params: any) => ({
      id: 'sub_test_' + Math.random().toString(36).substr(2, 9),
      customer: params.customer,
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: { data: [{ price: { unit_amount: 99900 } }] }
    })
  },
  refunds: {
    create: async (params: any) => ({
      id: 'ref_test_' + Math.random().toString(36).substr(2, 9),
      status: 'succeeded',
      amount: params.amount || 29900
    })
  },
  webhooks: {
    constructEvent: () => ({ type: 'payment_intent.succeeded' })
  }
} as any;

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  status: string;
  currentPeriodEnd: Date;
  plan: 'monthly' | 'yearly';
  amount: number;
}

export interface PaymentMethod {
  type: 'stripe' | 'paytm' | 'upi';
  enabled: boolean;
  displayName: string;
}

// Pricing configuration
export const PRICING = {
  subscription: {
    monthly: { amount: 99900, currency: 'inr', displayPrice: '₹999' }, // in paise
    yearly: { amount: 599900, currency: 'inr', displayPrice: '₹5,999' }
  },
  reports: {
    detailed: { amount: 29900, currency: 'inr', displayPrice: '₹299' },
    compatibility: { amount: 19900, currency: 'inr', displayPrice: '₹199' },
    remedies: { amount: 49900, currency: 'inr', displayPrice: '₹499' }
  }
};

/**
 * Get available payment methods
 */
export function getPaymentMethods(): PaymentMethod[] {
  return [
    {
      type: 'stripe',
      enabled: !!process.env.STRIPE_SECRET_KEY,
      displayName: 'Credit/Debit Card'
    },
    {
      type: 'paytm',
      enabled: !!process.env.PAYTM_MERCHANT_ID,
      displayName: 'Paytm Wallet'
    },
    {
      type: 'upi',
      enabled: !!process.env.UPI_MERCHANT_ID,
      displayName: 'UPI (GPay, PhonePe, etc.)'
    }
  ];
}

/**
 * Create Stripe payment intent
 */
export async function createStripePaymentIntent(
  amount: number,
  currency: string = 'inr',
  metadata: { [key: string]: string } = {}
): Promise<PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret || undefined
    };
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    throw new Error('Payment processing failed');
  }
}

/**
 * Create Stripe subscription
 */
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  metadata: { [key: string]: string } = {}
): Promise<Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    
    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan: metadata.plan as 'monthly' | 'yearly',
      amount: subscription.items.data[0]?.price?.unit_amount || 0
    };
  } catch (error) {
    console.error('Stripe subscription creation failed:', error);
    throw new Error('Subscription creation failed');
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(payload: string, signature: string): boolean {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return false;
  }
  
  try {
    stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    return true;
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    return false;
  }
}

/**
 * Create Paytm payment order (placeholder)
 */
export async function createPaytmOrder(
  amount: number,
  orderId: string,
  customerId: string
): Promise<{ orderId: string; token: string; url: string }> {
  // Placeholder implementation for Paytm integration
  // In production, integrate with Paytm SDK
  
  if (!process.env.PAYTM_MERCHANT_ID || !process.env.PAYTM_MERCHANT_KEY) {
    throw new Error('Paytm not configured');
  }
  
  // Mock Paytm response
  return {
    orderId,
    token: crypto.randomBytes(32).toString('hex'),
    url: `https://securegw-stage.paytm.in/order/process?orderId=${orderId}`
  };
}

/**
 * Create UPI payment link (placeholder)
 */
export async function createUpiPayment(
  amount: number,
  orderId: string,
  description: string
): Promise<{ paymentId: string; upiLink: string; qrCode: string }> {
  // Placeholder implementation for UPI integration
  
  if (!process.env.UPI_MERCHANT_ID) {
    throw new Error('UPI not configured');
  }
  
  const upiId = process.env.UPI_MERCHANT_ID;
  const upiLink = `upi://pay?pa=${upiId}&pn=NumenCoach&am=${amount/100}&cu=INR&tn=${description}&tr=${orderId}`;
  
  return {
    paymentId: crypto.randomBytes(16).toString('hex'),
    upiLink,
    qrCode: `data:image/svg+xml;base64,${Buffer.from(`<svg>QR Code for ${orderId}</svg>`).toString('base64')}`
  };
}

/**
 * Verify payment status
 */
export async function verifyPaymentStatus(paymentId: string, method: 'stripe' | 'paytm' | 'upi'): Promise<{
  status: 'pending' | 'completed' | 'failed';
  amount?: number;
  currency?: string;
}> {
  switch (method) {
    case 'stripe':
      if (!stripe) throw new Error('Stripe not configured');
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        return {
          status: paymentIntent.status === 'succeeded' ? 'completed' : 
                 paymentIntent.status === 'processing' ? 'pending' : 'failed',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        };
      } catch (error) {
        return { status: 'failed' };
      }
      
    case 'paytm':
      // Placeholder - integrate with Paytm status API
      return { status: 'pending' };
      
    case 'upi':
      // Placeholder - integrate with UPI status API
      return { status: 'pending' };
      
    default:
      throw new Error('Unsupported payment method');
  }
}

/**
 * Process refund
 */
export async function processRefund(
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<{ refundId: string; status: string; amount: number }> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentId,
      amount,
      reason: reason as any,
    });
    
    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount
    };
  } catch (error) {
    console.error('Refund processing failed:', error);
    throw new Error('Refund processing failed');
  }
}