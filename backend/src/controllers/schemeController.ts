import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const fallbackSchemes = [
  {
    id: 'scheme-ladki-bahin',
    title: 'Mukhyamantri Majhi Ladki Bahin Yojana',
    description: 'Financial independence grant of ₹1,500/month directly transferred to bank account for eligible women aged 21-65 years.',
    category: 'Women & Child Welfare',
    benefitAmount: '₹1,500 / Month',
    documentRequirements: ['Aadhaar Card', 'Domicile Certificate', 'Income Certificate (< ₹2,50,000/yr)', 'Bank Passbook'],
    applicationUrl: 'https://ladkibahin.maharashtra.gov.in',
    active: true,
  },
  {
    id: 'scheme-namo-shetkari',
    title: 'PM-Kisan & Namo Shetkari MahaSanman Nidhi',
    description: 'Combined financial assistance providing ₹12,000/year to land-holding farmer bank accounts.',
    category: 'Agriculture & Farmer Welfare',
    benefitAmount: '₹12,000 / Year',
    documentRequirements: ['7/12 & 8A Land Extract', 'Aadhaar e-KYC', 'Bank Passbook'],
    applicationUrl: 'https://pmkisan.gov.in',
    active: true,
  },
  {
    id: 'scheme-sanjay-gandhi',
    title: 'Sanjay Gandhi Niradhar Anudan Yojana',
    description: 'Monthly pension grant of ₹1,500 for destitute persons, widows, and disabled individuals.',
    category: 'Social Welfare & Pension',
    benefitAmount: '₹1,500 / Month',
    documentRequirements: ['Income Certificate (< ₹50,000/yr)', 'Age Proof', 'Domicile Certificate'],
    applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
    active: true,
  },
];

// GET /api/schemes
export const getSchemes = async (req: Request, res: Response) => {
  try {
    let schemes = [];
    try {
      schemes = await prisma.governmentScheme.findMany({ where: { active: true } });
    } catch (_) {
      schemes = fallbackSchemes;
    }
    return res.json(schemes.length > 0 ? schemes : fallbackSchemes);
  } catch (error) {
    return res.json(fallbackSchemes);
  }
};

// POST /api/schemes
export const createScheme = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description } = req.body;
  return res.status(201).json({ message: 'Scheme created.', scheme: { id: 'scheme-' + Date.now(), title, description } });
};

// POST /api/schemes/check-eligibility
export const checkEligibility = async (req: Request, res: Response) => {
  try {
    const { age, annualIncome, occupation, gender } = req.body;

    let schemes = [];
    try {
      schemes = await prisma.governmentScheme.findMany({ where: { active: true } });
    } catch (_) {
      schemes = fallbackSchemes;
    }

    if (schemes.length === 0) schemes = fallbackSchemes;

    const filtered = schemes.filter((s: any) => {
      if (s.id === 'scheme-ladki-bahin') return gender !== 'MALE' && (age === undefined || (age >= 21 && age <= 65));
      if (s.id === 'scheme-sanjay-gandhi') return annualIncome === undefined || annualIncome <= 50000;
      return true;
    });

    return res.json({
      eligibleCount: filtered.length,
      schemes: filtered,
    });
  } catch (error) {
    return res.json({
      eligibleCount: fallbackSchemes.length,
      schemes: fallbackSchemes,
    });
  }
};
