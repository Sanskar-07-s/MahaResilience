import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { sendWelcomeEmail } from '../services/brevoEmailService.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'maharesilience-secret-session-key-2026-auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch (dbErr: any) {
      if (dbErr.name === 'PrismaClientInitializationError' || (dbErr.message || '').includes("Can't reach database")) {
        return res.status(503).json({ error: 'Database service is currently unreachable. Please try again shortly.' });
      }
      throw dbErr;
    }

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role: role && Object.values(Role).includes(role) ? role : Role.CITIZEN,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Asynchronously dispatch welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('[Welcome Email Error]:', err.message || err);
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbErr: any) {
      if (dbErr.name === 'PrismaClientInitializationError' || (dbErr.message || '').includes("Can't reach database")) {
        return res.status(503).json({ error: 'Database service is currently unreachable. Please try again shortly.' });
      }
      throw dbErr;
    }

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      });
    } catch (dbErr: any) {
      if (dbErr.name === 'PrismaClientInitializationError' || (dbErr.message || '').includes("Can't reach database")) {
        return res.status(503).json({ error: 'Database service is currently unreachable. Please try again shortly.' });
      }
      throw dbErr;
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json(user);
  } catch (error) {
    next(error);
  }
};
