import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// GET /api/schemes
export const getSchemes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const filter = category ? { category: category as string, active: true } : { active: true };

    const schemes = await prisma.governmentScheme.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(schemes);
  } catch (error) {
    next(error);
  }
};

// POST /api/schemes (ADMIN only)
export const createScheme = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, eligibilityCriteria, documentRequirements, applicationUrl } = req.body;

    if (!title || !description || !category || !eligibilityCriteria || !documentRequirements) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const scheme = await prisma.governmentScheme.create({
      data: {
        title,
        description,
        category,
        eligibilityCriteria, // JSON containing e.g. { minAge: number, maxIncome: number, allowedOccupations: string[] }
        documentRequirements,
        applicationUrl,
      },
    });

    return res.status(201).json({
      message: 'Government Scheme created successfully.',
      scheme,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/schemes/check-eligibility
export const checkEligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { age, annualIncome, occupation, gender, residencyStatus } = req.body;

    if (age === undefined || annualIncome === undefined) {
      return res.status(400).json({ error: 'Age and annualIncome parameters are required.' });
    }

    const schemes = await prisma.governmentScheme.findMany({
      where: { active: true },
    });

    const eligibleSchemes = schemes.filter((scheme) => {
      const criteria = scheme.eligibilityCriteria as any;
      if (!criteria) return true; // No criteria means anyone is eligible

      // Age Check
      if (criteria.minAge && age < criteria.minAge) return false;
      if (criteria.maxAge && age > criteria.maxAge) return false;

      // Income Check
      if (criteria.maxIncome && annualIncome > criteria.maxIncome) return false;

      // Occupation Check
      if (criteria.allowedOccupations && criteria.allowedOccupations.length > 0) {
        if (!occupation || !criteria.allowedOccupations.includes(occupation)) return false;
      }

      // Gender Check
      if (criteria.allowedGenders && criteria.allowedGenders.length > 0) {
        if (!gender || !criteria.allowedGenders.includes(gender)) return false;
      }

      // Residency Check
      if (criteria.requiresMaharashtraResidency) {
        if (residencyStatus !== 'MAHARASHTRA') return false;
      }

      return true;
    });

    return res.json({
      eligibleCount: eligibleSchemes.length,
      schemes: eligibleSchemes,
    });
  } catch (error) {
    next(error);
  }
};
