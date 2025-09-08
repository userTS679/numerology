import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    isEmailVerified: boolean;
  };
}

/**
 * Middleware to authenticate user via JWT token
 */
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // In production, verify user exists and is active
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      fullName: decoded.fullName || 'User',
      isEmailVerified: decoded.isEmailVerified || false
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Audit logging middleware
 */
export function auditLog(action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log the action
    const logData = {
      userId: req.user?.id,
      action,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Log request
    console.log('Audit Log:', logData);

    // Continue with request
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`Action ${action} completed in ${duration}ms with status ${res.statusCode}`);
    });

    next();
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const userRequests = requests.get(key);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }
    
    userRequests.count++;
    next();
  };
}