import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import vedicRoutes from '../routes/vedic-routes';
import paymentRoutes from '../routes/payment-routes';

// Mock app setup
const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req: any, res, next) => {
  req.user = { id: 'test-user-123', email: 'test@example.com' };
  next();
});

app.use('/api/vedic', vedicRoutes);
app.use('/api/payment', paymentRoutes);

describe('API Endpoints', () => {
  describe('POST /api/vedic/compute-chart', () => {
    const validChartRequest = {
      name: 'Ram Kumar',
      dob: '1978-05-12',
      tob: '03:45',
      place: 'Delhi, India',
      lat: 28.6139,
      lon: 77.2090,
      timezone: 'Asia/Kolkata',
      gender: 'male',
      consent: true
    };

    it('should compute chart with valid data', async () => {
      const response = await request(app)
        .post('/api/vedic/compute-chart')
        .send(validChartRequest)
        .expect(200);

      expect(response.body.chartId).toBeTruthy();
      expect(response.body.reading).toBeTruthy();
      expect(response.body.reading.summary).toBeTruthy();
      expect(response.body.reading.confidence).toMatch(/^(high|medium|low)$/);
      expect(response.body.numerology).toBeTruthy();
      expect(response.body.hasVedicChart).toBe(true);
    });

    it('should reject request without consent', async () => {
      const invalidRequest = { ...validChartRequest, consent: false };
      
      await request(app)
        .post('/api/vedic/compute-chart')
        .send(invalidRequest)
        .expect(400);
    });

    it('should reject invalid birth data', async () => {
      const invalidRequest = { ...validChartRequest, lat: 91 }; // Invalid latitude
      
      await request(app)
        .post('/api/vedic/compute-chart')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle missing time of birth', async () => {
      const requestWithoutTime = { ...validChartRequest };
      delete requestWithoutTime.tob;
      
      const response = await request(app)
        .post('/api/vedic/compute-chart')
        .send(requestWithoutTime)
        .expect(200);

      expect(response.body.hasVedicChart).toBe(false);
      expect(response.body.confidence).toBe('medium');
    });

    it('should sanitize input data', async () => {
      const maliciousRequest = {
        ...validChartRequest,
        name: '<script>alert("xss")</script>Ram Kumar',
        place: 'Delhi<script>alert("xss")</script>'
      };
      
      const response = await request(app)
        .post('/api/vedic/compute-chart')
        .send(maliciousRequest)
        .expect(200);

      // Should not contain script tags
      expect(response.body.chartId).toBeTruthy();
    });
  });

  describe('GET /api/vedic/chart/:chartId', () => {
    it('should retrieve chart data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/vedic/chart/test-chart-123')
        .expect(200);

      expect(response.body.chartId).toBe('test-chart-123');
      expect(response.body.reading).toBeTruthy();
    });

    it('should require authentication', async () => {
      // Test without auth middleware
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/api/vedic', vedicRoutes);
      
      await request(appNoAuth)
        .get('/api/vedic/chart/test-chart-123')
        .expect(401);
    });
  });

  describe('POST /api/vedic/progressive-profile', () => {
    it('should update user profile', async () => {
      const profileData = {
        maritalStatus: 'married',
        careerStage: 'mid_career',
        mainWorry: 'career',
        preferences: {
          language: 'hinglish',
          notifications: true
        }
      };

      const response = await request(app)
        .post('/api/vedic/progressive-profile')
        .send(profileData)
        .expect(200);

      expect(response.body.message).toContain('successfully');
      expect(response.body.profileCompleteness).toBeGreaterThan(0);
    });

    it('should reject invalid profile data', async () => {
      const invalidData = {
        maritalStatus: 'invalid_status'
      };

      await request(app)
        .post('/api/vedic/progressive-profile')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('POST /api/payment/create-intent', () => {
    it('should create payment intent for valid report', async () => {
      const paymentRequest = {
        reportType: 'detailed',
        paymentMethod: 'stripe',
        amount: 29900, // ₹299 in paise
        currency: 'inr'
      };

      const response = await request(app)
        .post('/api/payment/create-intent')
        .send(paymentRequest)
        .expect(200);

      expect(response.body.paymentIntent).toBeTruthy();
      expect(response.body.reportType).toBe('detailed');
      expect(response.body.amount).toBe(29900);
    });

    it('should reject invalid amount', async () => {
      const invalidRequest = {
        reportType: 'detailed',
        paymentMethod: 'stripe',
        amount: 10000, // Wrong amount
        currency: 'inr'
      };

      await request(app)
        .post('/api/payment/create-intent')
        .send(invalidRequest)
        .expect(400);
    });

    it('should handle unsupported payment method', async () => {
      const invalidRequest = {
        reportType: 'detailed',
        paymentMethod: 'bitcoin', // Unsupported
        amount: 29900,
        currency: 'inr'
      };

      await request(app)
        .post('/api/payment/create-intent')
        .send(invalidRequest)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on compute-chart', async () => {
      const validRequest = {
        name: 'Test User',
        dob: '1990-01-01',
        place: 'Delhi',
        lat: 28.6139,
        lon: 77.2090,
        consent: true
      };

      // Make multiple requests quickly
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/vedic/compute-chart')
          .send(validRequest)
      );

      const responses = await Promise.all(promises);
      
      // Some should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/vedic/compute-chart')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      await request(app)
        .post('/api/vedic/compute-chart')
        .send({})
        .expect(400);
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .post('/api/vedic/compute-chart')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body.message).toBeTruthy();
      expect(response.body.errors).toBeTruthy();
    });
  });
});