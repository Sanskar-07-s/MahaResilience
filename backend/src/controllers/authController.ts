import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/brevoEmailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'maharesilience-secret-session-key-2026-auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'A user with this phone number already exists.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role && Object.values(Role).includes(role as Role) ? (role as Role) : Role.CITIZEN;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: userRole,
        isVerified: userRole === Role.CITIZEN || userRole === Role.TOURIST, // Volunteers/Officials need admin verification
      },
    });

    // If it's a volunteer, create volunteer profile
    if (userRole === Role.VOLUNTEER) {
      await prisma.volunteer.create({
        data: {
          userId: user.id,
          skills: req.body.skills || [],
          areaOfOperations: req.body.areaOfOperations || [],
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email via Brevo REST API
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.warn('[Brevo Welcome Email Dispatch Warning]:', err);
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

    const user = await prisma.user.findUnique({ where: { email } });
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

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        volunteerProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      volunteerProfile: user.volunteerProfile,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};
