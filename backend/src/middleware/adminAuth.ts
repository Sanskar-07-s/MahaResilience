import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from './auth.js';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'maharesilience-secret-session-key-2026-auth';

/**
 * Middleware requiring JWT authentication AND ADMIN role
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token is required for admin access.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };

    if (decoded.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }

    req.user = decoded as any;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin authentication token.' });
  }
};
