import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { users, userProfiles, auditLogs } from '@shared/production-schema';
import { eq } from 'drizzle-orm';
import { encryptPII, decryptPII } from './security';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  gender?: string;
  dataConsent: boolean;
}

/**
 * Register new user with complete profile
 */
export async function registerUser(data: RegisterData): Promise<{ user: AuthUser; token: string; profileId: string }> {
  try {
    // Validate required fields
    if (!data.email || !data.password || !data.fullName || !data.dateOfBirth || !data.placeOfBirth) {
      throw new Error('Required fields missing');
    }

    if (!data.dataConsent) {
      throw new Error('Data consent is required');
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      isEmailVerified: false,
    }).returning();

    // Create user profile with encrypted birth data
    const [profile] = await db.insert(userProfiles).values({
      userId: newUser.id,
      dateOfBirth: encryptPII(data.dateOfBirth),
      timeOfBirth: data.timeOfBirth ? encryptPII(data.timeOfBirth) : null,
      placeOfBirth: encryptPII(data.placeOfBirth),
      latitude: data.latitude?.toString(),
      longitude: data.longitude?.toString(),
      timezone: data.timezone,
      gender: data.gender,
      dataConsent: data.dataConsent,
      consentTimestamp: new Date(),
      profileCompleteness: calculateProfileCompleteness(data),
    }).returning();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        profileId: profile.id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log registration
    await logAuditEvent(newUser.id, 'user_registered', 'user', newUser.id, true);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        isEmailVerified: newUser.isEmailVerified || false,
      },
      token,
      profileId: profile.id
    };

  } catch (error) {
    console.error('User registration error:', error);
    throw error;
  }
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string; profileId: string }> {
  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Get user profile
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        profileId: profile.id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log login
    await logAuditEvent(user.id, 'user_login', 'user', user.id, true);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified || false,
      },
      token,
      profileId: profile.id
    };

  } catch (error) {
    console.error('User login error:', error);
    throw error;
  }
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<AuthUser & { profileId: string }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (!user || !user.isActive) {
      throw new Error('Invalid token');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified || false,
      profileId: decoded.profileId
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(data: any): number {
  let score = 0;
  const fields = [
    'fullName', 'dateOfBirth', 'placeOfBirth', // Required: 30%
    'timeOfBirth', 'gender', // Important: 20%
    'maritalStatus', 'occupation', // Personal: 20%
    'careerStage', 'mainConcerns', 'lifeGoals' // Progressive: 30%
  ];
  
  const weights = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
  
  fields.forEach((field, index) => {
    if (data[field] && data[field] !== '') {
      score += weights[index];
    }
  });
  
  return Math.min(score, 100);
}

/**
 * Log audit events
 */
export async function logAuditEvent(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string,
  success: boolean,
  metadata?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      resource,
      resourceId,
      success,
      errorMessage: success ? null : metadata?.error,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    maritalStatus: string;
    occupation: string;
    careerStage: string;
    mainConcerns: string[];
    lifeGoals: string[];
    language: string;
    notificationPreferences: any;
    privacySettings: any;
  }>
): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Add non-sensitive updates
    if (updates.maritalStatus) updateData.maritalStatus = updates.maritalStatus;
    if (updates.occupation) updateData.occupation = updates.occupation;
    if (updates.careerStage) updateData.careerStage = updates.careerStage;
    if (updates.mainConcerns) updateData.mainConcerns = updates.mainConcerns;
    if (updates.lifeGoals) updateData.lifeGoals = updates.lifeGoals;
    if (updates.language) updateData.language = updates.language;
    if (updates.notificationPreferences) updateData.notificationPreferences = updates.notificationPreferences;
    if (updates.privacySettings) updateData.privacySettings = updates.privacySettings;

    // Recalculate profile completeness
    const [currentProfile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (currentProfile) {
      const completenessData = {
        ...currentProfile,
        ...updates
      };
      updateData.profileCompleteness = calculateProfileCompleteness(completenessData);
    }

    await db.update(userProfiles).set(updateData).where(eq(userProfiles.userId, userId));

    // Log profile update
    await logAuditEvent(userId, 'profile_updated', 'user_profile', userId, true, { updatedFields: Object.keys(updates) });

  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
}

/**
 * Get user profile with decrypted data
 */
export async function getUserProfile(userId: string): Promise<any> {
  try {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Decrypt sensitive data
    const decryptedProfile = {
      ...profile,
      dateOfBirth: decryptPII(profile.dateOfBirth),
      timeOfBirth: profile.timeOfBirth ? decryptPII(profile.timeOfBirth) : null,
      placeOfBirth: decryptPII(profile.placeOfBirth),
    };

    // Log profile access
    await logAuditEvent(userId, 'profile_accessed', 'user_profile', userId, true);

    return decryptedProfile;

  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

/**
 * Delete user account and all data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    // This will cascade delete all related data due to foreign key constraints
    await db.delete(users).where(eq(users.id, userId));

    // Log account deletion
    await logAuditEvent(userId, 'account_deleted', 'user', userId, true);

  } catch (error) {
    console.error('Account deletion error:', error);
    throw error;
  }
}