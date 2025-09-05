import { Router } from 'express';
import { authenticateUser, auditLog, type AuthenticatedRequest } from '../middleware/auth';
import { registerUser, loginUser, updateUserProfile, getUserProfile, deleteUserAccount } from '../services/auth-service';
import { generateKundli, getUserKundli, generateDetailedReport } from '../services/kundli-generator';
import { validateRegistration, validateLogin, validateProfileUpdate } from '../middleware/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const kundliLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 kundli generations per hour
  message: { message: 'Kundli generation limit reached, please try again later' },
});

/**
 * POST /api/users/register
 * Complete user registration with automatic Kundli generation
 */
router.post('/register',
  authLimiter,
  validateRegistration,
  async (req, res) => {
    try {
      const registrationData = req.body;
      
      // Register user and create profile
      const { user, token, profileId } = await registerUser(registrationData);
      
      // Automatically generate Kundli
      let kundli = null;
      try {
        kundli = await generateKundli({
          userId: user.id,
          profileId,
          name: registrationData.fullName,
          dateOfBirth: registrationData.dateOfBirth,
          timeOfBirth: registrationData.timeOfBirth,
          placeOfBirth: registrationData.placeOfBirth,
          latitude: registrationData.latitude,
          longitude: registrationData.longitude,
          timezone: registrationData.timezone || 'Asia/Kolkata',
          gender: registrationData.gender,
        });
      } catch (kundliError) {
        console.warn('Kundli generation failed during registration:', kundliError);
        // Continue with registration even if Kundli generation fails
      }

      res.status(201).json({
        message: 'Registration successful',
        user,
        token,
        kundli,
        nextSteps: {
          emailVerification: !user.isEmailVerified,
          profileCompletion: true,
          kundliReady: !!kundli
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        message: error.message || 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

/**
 * POST /api/users/login
 */
router.post('/login',
  authLimiter,
  validateLogin,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const { user, token, profileId } = await loginUser(email, password);
      
      // Get user's existing Kundli
      const kundli = await getUserKundli(user.id);
      
      res.json({
        message: 'Login successful',
        user,
        token,
        kundli,
        hasKundli: !!kundli
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ 
        message: error.message || 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

/**
 * GET /api/users/profile
 * Get complete user profile
 */
router.get('/profile',
  authenticateUser,
  auditLog('get_user_profile'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const profile = await getUserProfile(userId);
      const kundli = await getUserKundli(userId);
      
      res.json({
        profile,
        kundli,
        hasKundli: !!kundli,
        profileCompleteness: profile.profileCompleteness || 0
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  }
);

/**
 * PUT /api/users/profile
 * Update user profile (progressive profiling)
 */
router.put('/profile',
  authenticateUser,
  validateProfileUpdate,
  auditLog('update_user_profile'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const updates = req.body;
      
      await updateUserProfile(userId, updates);
      
      // Get updated profile
      const updatedProfile = await getUserProfile(userId);
      
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile,
        profileCompleteness: updatedProfile.profileCompleteness
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);

/**
 * POST /api/users/generate-kundli
 * Generate or regenerate Kundli chart
 */
router.post('/generate-kundli',
  authenticateUser,
  kundliLimiter,
  auditLog('generate_kundli'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user profile for birth data
      const profile = await getUserProfile(userId);
      if (!profile) {
        return res.status(400).json({ message: 'User profile not found' });
      }

      // Generate Kundli
      const kundli = await generateKundli({
        userId,
        profileId: profile.id,
        name: req.user!.fullName,
        dateOfBirth: profile.dateOfBirth,
        timeOfBirth: profile.timeOfBirth,
        placeOfBirth: profile.placeOfBirth,
        latitude: parseFloat(profile.latitude || '0'),
        longitude: parseFloat(profile.longitude || '0'),
        timezone: profile.timezone || 'Asia/Kolkata',
        gender: profile.gender,
      });

      res.json({
        message: 'Kundli generated successfully',
        kundli
      });

    } catch (error) {
      console.error('Kundli generation error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to generate Kundli',
        code: 'KUNDLI_GENERATION_ERROR'
      });
    }
  }
);

/**
 * GET /api/users/kundli
 * Get user's existing Kundli
 */
router.get('/kundli',
  authenticateUser,
  auditLog('get_user_kundli'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const kundli = await getUserKundli(userId);
      
      if (!kundli) {
        return res.status(404).json({ 
          message: 'No Kundli found',
          suggestion: 'Generate your Kundli first'
        });
      }

      res.json({
        kundli,
        lastAccessed: new Date()
      });

    } catch (error) {
      console.error('Get Kundli error:', error);
      res.status(500).json({ message: 'Failed to fetch Kundli' });
    }
  }
);

/**
 * POST /api/users/detailed-report
 * Generate detailed premium report
 */
router.post('/detailed-report',
  authenticateUser,
  auditLog('generate_detailed_report'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { chartId, reportType = 'complete' } = req.body;
      
      if (!chartId) {
        return res.status(400).json({ message: 'Chart ID is required' });
      }

      // Check if user has access to detailed reports (subscription or payment)
      // This would check subscription status in production
      
      const detailedReport = await generateDetailedReport(chartId, userId, reportType);
      
      res.json({
        message: 'Detailed report generated',
        report: detailedReport
      });

    } catch (error) {
      console.error('Detailed report error:', error);
      res.status(500).json({ message: 'Failed to generate detailed report' });
    }
  }
);

/**
 * DELETE /api/users/account
 * Delete user account and all data
 */
router.delete('/account',
  authenticateUser,
  auditLog('delete_user_account'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { confirmationCode } = req.body;
      
      // In production, verify confirmation code sent via email
      if (!confirmationCode || confirmationCode !== 'DELETE_MY_ACCOUNT') {
        return res.status(400).json({ 
          message: 'Invalid confirmation code',
          required: 'Type DELETE_MY_ACCOUNT to confirm'
        });
      }

      await deleteUserAccount(userId);
      
      res.json({
        message: 'Account deleted successfully',
        deletedAt: new Date()
      });

    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  }
);

export default router;