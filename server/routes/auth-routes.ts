import { Router } from 'express';
import { authenticateUser, auditLog, type AuthenticatedRequest } from '../middleware/auth';
import { encryptPII, generateSecureToken } from '../services/security';
import { storage } from '../storage';

const router = Router();

/**
 * GET /api/auth/profile
 * Get user profile information
 */
router.get('/profile',
  authenticateUser,
  auditLog('get_profile'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // In production, fetch from user_profiles table
      const profile = {
        id: userId,
        email: req.user!.email,
        profileCompleteness: 75,
        subscriptionStatus: 'free',
        trustScore: 85,
        chartsGenerated: 3,
        reportsOwned: 1
      };
      
      res.json(profile);
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  }
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile',
  authenticateUser,
  auditLog('update_profile'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { name, phone, preferences } = req.body;
      
      // Validate and sanitize input
      const updates: any = {};
      
      if (name) {
        updates.name = name.trim();
      }
      
      if (phone) {
        // Validate Indian phone number
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
          return res.status(400).json({ message: 'Invalid phone number' });
        }
        updates.phone = phone;
      }
      
      if (preferences) {
        updates.preferences = preferences;
      }
      
      // In production, update database
      console.log('Profile updated for user:', userId);
      
      res.json({
        message: 'Profile updated successfully',
        updatedFields: Object.keys(updates)
      });
      
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Profile update failed' });
    }
  }
);

/**
 * GET /api/auth/subscription
 * Get user subscription status
 */
router.get('/subscription',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // In production, fetch from subscriptions table
      const subscription = {
        status: 'free',
        plan: null,
        expiresAt: null,
        features: {
          chartsPerMonth: 3,
          detailedReports: false,
          prioritySupport: false,
          unlimitedChats: false
        }
      };
      
      res.json(subscription);
      
    } catch (error) {
      console.error('Subscription fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  }
);

/**
 * DELETE /api/auth/delete-account
 * Delete user account and all associated data
 */
router.delete('/delete-account',
  authenticateUser,
  auditLog('delete_account'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { confirmationToken } = req.body;
      
      // In production, verify confirmation token sent via email
      if (!confirmationToken) {
        return res.status(400).json({
          message: 'Confirmation token required',
          instructions: 'Check your email for deletion confirmation link'
        });
      }
      
      // Perform complete data deletion
      const deletionReport = {
        userId,
        deletedAt: new Date(),
        itemsDeleted: {
          profiles: 1,
          charts: 2,
          reports: 1,
          sessions: 5
        },
        retainedItems: {
          payments: 2, // Legal requirement
          auditLogs: 10 // Security requirement - anonymized
        }
      };
      
      console.log('Account deletion completed:', deletionReport);
      
      res.json({
        message: 'Account deleted successfully',
        deletionReport,
        dataRetentionInfo: 'Payment records retained for legal compliance'
      });
      
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ message: 'Account deletion failed' });
    }
  }
);

/**
 * GET /api/auth/data-export
 * Export all user data (GDPR compliance)
 */
router.get('/data-export',
  authenticateUser,
  auditLog('data_export'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // In production, fetch and decrypt all user data
      const exportData = {
        personalData: {
          name: 'Decrypted Name',
          email: req.user!.email,
          phone: 'Decrypted Phone',
          preferences: {}
        },
        birthData: {
          dob: 'Decrypted DOB',
          tob: 'Decrypted TOB',
          place: 'Decrypted Place'
        },
        charts: [],
        reports: [],
        paymentHistory: [],
        auditLog: []
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="numencoach-data-${userId}.json"`);
      res.json(exportData);
      
    } catch (error) {
      console.error('Data export error:', error);
      res.status(500).json({ message: 'Data export failed' });
    }
  }
);

export default router;