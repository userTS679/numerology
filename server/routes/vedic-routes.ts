import { Router } from 'express';
import { authenticateUser, auditLog, type AuthenticatedRequest } from '../middleware/auth';
import { validateChartCompute, validatePaymentIntent, sanitizeInput } from '../middleware/validation';
import { generateKundli, getUserKundli } from '../services/kundli-generator';
import { updateUserProfile, getUserProfile } from '../services/auth-service';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for chart generation
const chartLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 charts per hour
  message: { message: 'Chart generation limit reached, please try again later' },
});

/**
 * POST /api/vedic/compute-chart
 * Generate Kundli chart with birth data
 */
router.post('/compute-chart',
  authenticateUser,
  chartLimiter,
  sanitizeInput,
  validateChartCompute,
  auditLog('compute_chart'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, dob, tob, place, lat, lon, timezone, gender, consent } = req.body;
      
      if (!consent) {
        return res.status(400).json({
          message: 'Data consent is required',
          errors: [{ field: 'consent', message: 'Consent must be true' }]
        });
      }

      // Validate coordinates
      if (lat && (lat < -90 || lat > 90)) {
        return res.status(400).json({
          message: 'Invalid latitude',
          errors: [{ field: 'lat', message: 'Latitude must be between -90 and 90' }]
        });
      }

      if (lon && (lon < -180 || lon > 180)) {
        return res.status(400).json({
          message: 'Invalid longitude',
          errors: [{ field: 'lon', message: 'Longitude must be between -180 and 180' }]
        });
      }

      const userId = req.user!.id;
      
      // Generate Kundli
      const kundli = await generateKundli({
        userId,
        profileId: userId, // Using userId as profileId for simplicity
        name,
        dateOfBirth: dob,
        timeOfBirth: tob,
        placeOfBirth: place,
        latitude: lat || 28.6139, // Default to Delhi
        longitude: lon || 77.2090,
        timezone: timezone || 'Asia/Kolkata',
        gender,
      });

      // Calculate numerology for additional insights
      const [year, month, day] = dob.split('-').map(Number);
      const { calculateNumerology } = await import('../services/numerology');
      const numerology = calculateNumerology(name, day, month, year);

      res.json({
        chartId: kundli.chartId,
        reading: kundli.reading,
        numerology,
        hasVedicChart: kundli.hasVedicChart,
        confidence: kundli.reading.confidence
      });

    } catch (error) {
      console.error('Chart computation error:', error);
      res.status(500).json({ 
        message: 'Chart generation failed',
        errors: [{ field: 'general', message: error.message }]
      });
    }
  }
);

/**
 * GET /api/vedic/chart/:chartId
 * Retrieve existing chart data
 */
router.get('/chart/:chartId',
  authenticateUser,
  auditLog('get_chart'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { chartId } = req.params;
      const userId = req.user!.id;
      
      // Mock chart retrieval - in production, fetch from database
      const mockChart = {
        chartId,
        userId,
        reading: {
          summary: 'Your chart shows strong planetary positions',
          details: 'Jupiter in 5th house brings good fortune',
          confidence: 'high'
        },
        natalChart: {},
        createdAt: new Date()
      };

      res.json(mockChart);

    } catch (error) {
      console.error('Chart retrieval error:', error);
      res.status(500).json({ message: 'Failed to retrieve chart' });
    }
  }
);

/**
 * POST /api/vedic/progressive-profile
 * Update user profile progressively
 */
router.post('/progressive-profile',
  authenticateUser,
  sanitizeInput,
  auditLog('update_progressive_profile'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { maritalStatus, careerStage, mainWorry, preferences } = req.body;

      // Validate marital status
      const validMaritalStatuses = ['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'];
      if (maritalStatus && !validMaritalStatuses.includes(maritalStatus)) {
        return res.status(400).json({
          message: 'Invalid marital status',
          errors: [{ field: 'maritalStatus', message: 'Invalid value provided' }]
        });
      }

      // Update profile
      await updateUserProfile(userId, {
        maritalStatus,
        careerStage,
        mainConcerns: mainWorry ? [mainWorry] : undefined,
        notificationPreferences: preferences
      });

      // Calculate profile completeness
      const profileCompleteness = calculateCompleteness({
        maritalStatus,
        careerStage,
        mainWorry,
        preferences
      });

      res.json({
        message: 'Profile updated successfully',
        profileCompleteness
      });

    } catch (error) {
      console.error('Progressive profile update error:', error);
      res.status(500).json({ message: 'Profile update failed' });
    }
  }
);

/**
 * GET /api/vedic/profile
 * Get user's complete profile
 */
router.get('/profile',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const profile = await getUserProfile(userId);
      
      res.json(profile);

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  }
);

function calculateCompleteness(data: any): number {
  let score = 0;
  const fields = ['maritalStatus', 'careerStage', 'mainWorry', 'preferences'];
  
  fields.forEach(field => {
    if (data[field] && data[field] !== '') {
      score += 25;
    }
  });
  
  return Math.min(score, 100);
}

export default router;