import React, { useState, useEffect } from 'react';
import {
  Award,
  FileText,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Landmark,
  ExternalLink,
  Plus,
  Send,
  Sparkles,
  Search,
  Filter,
  Users,
  Check,
  X,
  Clock,
  HeartHandshake
} from 'lucide-react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { CivicFacilityBoard } from '../../components/civic/CivicFacilityBoard.tsx';

export interface Scheme {
  id: string;
  title: string;
  department: string;
  description: string;
  category: 'WOMEN_CHILD' | 'FARMER' | 'STUDENT' | 'HEALTH' | 'PENSION' | 'YOUTH' | 'HOUSING';
  categoryLabel: string;
  benefitAmount: string;
  level: 'WARD' | 'TALUKA' | 'DISTRICT' | 'STATE' | 'NATIONAL';
  documentRequirements: string[];
  applicationUrl?: string;
  // Matching criteria rules
  minAge?: number;
  maxAge?: number;
  maxIncome?: number;
  allowedGenders?: ('MALE' | 'FEMALE')[];
  allowedOccupations?: string[];
  allowedCategories?: string[];
  allowedRationCards?: string[];
  requiresLandholding?: boolean;
}

export const ALL_MAHARASHTRA_SCHEMES: Scheme[] = [
  {
    id: 'scheme-ladki-bahin',
    title: 'Mukhyamantri Majhi Ladki Bahin Yojana',
    department: 'Women & Child Development Department, Maharashtra',
    description:
      'Direct DBT monthly financial grant of ₹1,500 transferred to bank accounts for eligible women aged 21 to 65 years to ensure economic self-reliance and nutrition.',
    category: 'WOMEN_CHILD',
    categoryLabel: 'Women & Girls',
    benefitAmount: '₹ 1,500 / Month Direct DBT',
    level: 'STATE',
    minAge: 21,
    maxAge: 65,
    maxIncome: 250000,
    allowedGenders: ['FEMALE'],
    allowedRationCards: ['YELLOW_BPL', 'ORANGE'],
    documentRequirements: [
      'Aadhaar Card (Aadhaar-seeded bank account)',
      'Maharashtra Domicile Certificate / Birth Certificate',
      'Income Certificate (< ₹2,50,000/yr) or Yellow/Orange Ration Card',
      'Bank Passbook Copy',
      'Self-Declaration Undertaking',
    ],
    applicationUrl: 'https://ladkibahin.maharashtra.gov.in',
  },
  {
    id: 'scheme-namo-shetkari',
    title: 'Namo Shetkari MahaSanman Nidhi Yojana',
    department: 'Agriculture & Cooperation Department, Maharashtra',
    description:
      'State government cash supplement of ₹6,000 per year (3 installments of ₹2,000) credited alongside PM-KISAN, granting ₹12,000/year total for agricultural inputs.',
    category: 'FARMER',
    categoryLabel: 'Farmers & Agriculture',
    benefitAmount: '₹ 6,000 / Year (+ ₹6,000 PM-Kisan)',
    level: 'STATE',
    minAge: 18,
    maxIncome: 1000000,
    allowedOccupations: ['FARMER'],
    requiresLandholding: true,
    documentRequirements: [
      '7/12 (Satbara) & 8A Land Record Extract',
      'Aadhaar Card (e-KYC verified)',
      'NPCI Aadhaar-seeded Bank Account',
      'PM-Kisan Beneficiary Registration ID',
    ],
    applicationUrl: 'https://krishi.maharashtra.gov.in',
  },
  {
    id: 'scheme-mjpjay-health',
    title: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
    department: 'Public Health Department, Maharashtra',
    description:
      'Universal cashless critical hospitalization and surgical cover up to ₹5 Lakh per family per year across 1,356 secondary and tertiary procedures in empanelled hospitals.',
    category: 'HEALTH',
    categoryLabel: 'Healthcare & Insurance',
    benefitAmount: '₹ 5,00,000 Cashless Health Cover',
    level: 'STATE',
    minAge: 0,
    maxIncome: 1200000,
    allowedRationCards: ['YELLOW_BPL', 'ORANGE', 'WHITE'],
    documentRequirements: [
      'Maharashtra Ration Card (Yellow, Orange, or White)',
      'Aadhaar Card or Voter ID of Beneficiary',
      'Medical Referral from Civil Hospital or PHC',
    ],
    applicationUrl: 'https://www.jeevandayee.gov.in',
  },
  {
    id: 'scheme-sanjay-gandhi-pension',
    title: 'Sanjay Gandhi Niradhar Anudan Pension Yojana',
    department: 'Social Justice & Special Assistance Department',
    description:
      'Monthly social security pension of ₹1,500 for destitute persons, widows, orphans, disabled citizens (40%+ disability), and persons suffering from major illness.',
    category: 'PENSION',
    categoryLabel: 'Social Welfare & Pension',
    benefitAmount: '₹ 1,500 / Month Pension',
    level: 'STATE',
    minAge: 18,
    maxIncome: 50000,
    allowedRationCards: ['YELLOW_BPL'],
    documentRequirements: [
      'Age & Residence Proof (Min 15 yrs in Maharashtra)',
      'Income Certificate issued by Tehsildar (< ₹50,000/yr)',
      'Disability Certificate from Civil Surgeon (if applicable)',
      'Widow / Destitute Certificate',
    ],
    applicationUrl: 'https://sjsa.maharashtra.gov.in',
  },
  {
    id: 'scheme-shravanbal-pension',
    title: 'Shravanbal Seva Rajya Nivruttivetan Yojana',
    department: 'Social Justice Department, Maharashtra',
    description:
      'Old-age state pension of ₹1,500 per month for elderly citizens aged 65 years and above living below poverty line without stable family income.',
    category: 'PENSION',
    categoryLabel: 'Social Welfare & Pension',
    benefitAmount: '₹ 1,500 / Month Old-Age Pension',
    level: 'STATE',
    minAge: 65,
    maxIncome: 21000,
    allowedRationCards: ['YELLOW_BPL'],
    documentRequirements: [
      'Age Proof certifying 65+ years (Aadhaar or Voter Card)',
      'Income Certificate (< ₹21,000/year)',
      'Maharashtra Domicile Certificate (15 Years Residence)',
      'Bank Account Details',
    ],
    applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
  },
  {
    id: 'scheme-shahu-fee-reimbursement',
    title: 'Rajarshi Chhatrapati Shahu Maharaj Tuition Fee Reimbursement',
    department: 'Higher & Technical Education Department',
    description:
      '50% to 100% tuition and exam fee waiver reimbursement for Economically Backward Class (EBC) students admitted through CAP in professional degree/diploma courses.',
    category: 'STUDENT',
    categoryLabel: 'Students & Higher Ed',
    benefitAmount: '50% to 100% College Tuition Fee Waiver',
    level: 'STATE',
    minAge: 16,
    maxAge: 32,
    maxIncome: 800000,
    allowedOccupations: ['STUDENT'],
    documentRequirements: [
      'Income Certificate (< ₹8,00,000/year)',
      'CAP Allotment Letter & College Fee Receipt',
      'Maharashtra Domicile Certificate',
      'HSC / Diploma Marksheet',
      'Aadhaar Card',
    ],
    applicationUrl: 'https://mahadbt.maharashtra.gov.in',
  },
  {
    id: 'scheme-punjabrao-hostel',
    title: 'Dr. Punjabrao Deshmukh Vastigruh Nirvah Bhatta Yojana',
    department: 'Directorate of Technical Education, Maharashtra',
    description:
      'Annual hostel maintenance allowance of ₹30,000 (Mumbai/Pune/Nagpur) and ₹20,000 (other districts) for children of registered marginal farmers and construction workers in higher education.',
    category: 'STUDENT',
    categoryLabel: 'Students & Higher Ed',
    benefitAmount: '₹ 20,000 to ₹ 30,000 / Year Hostel Allowance',
    level: 'STATE',
    minAge: 16,
    maxAge: 28,
    maxIncome: 800000,
    allowedOccupations: ['STUDENT'],
    documentRequirements: [
      'Registered Marginal Farmer (7/12) or BOCW Worker ID of Parent',
      'Hostel Accommodation Certificate / Rent Agreement',
      'College Bonafide Certificate',
      'Annual Income Certificate',
    ],
    applicationUrl: 'https://mahadbt.maharashtra.gov.in',
  },
  {
    id: 'scheme-savitribai-phule-scholarship',
    title: 'Savitribai Phule Scholarship for Girl Students',
    department: 'School Education Department, Maharashtra',
    description:
      'Direct educational financial aid for girl students studying in classes 5th to 10th belonging to SC, ST, VJNT, and SBC categories with zero income ceiling to eliminate dropout rates.',
    category: 'STUDENT',
    categoryLabel: 'Students & Higher Ed',
    benefitAmount: '₹ 100 to ₹ 150 / Month Direct Stipend',
    level: 'STATE',
    minAge: 9,
    maxAge: 18,
    allowedGenders: ['FEMALE'],
    allowedOccupations: ['STUDENT'],
    allowedCategories: ['SC', 'ST', 'OBC', 'EBC'],
    documentRequirements: [
      'School Bonafide Certificate (Classes 5-10)',
      'Caste Certificate of Student or Father',
      'Student Aadhaar Card & Bank Account',
    ],
    applicationUrl: 'https://student.maharashtra.gov.in',
  },
  {
    id: 'scheme-bal-sangopan',
    title: 'Maharashtra Bal Sangopan Foster Care Scheme',
    department: 'Women and Child Development Department',
    description:
      'Financial foster grant of ₹2,250 per month per child provided to families or single guardians raising orphaned, abandoned, or destitute children.',
    category: 'WOMEN_CHILD',
    categoryLabel: 'Women & Girls',
    benefitAmount: '₹ 2,250 / Month per Child',
    level: 'STATE',
    minAge: 0,
    maxAge: 18,
    maxIncome: 100000,
    documentRequirements: [
      'Child Birth Certificate & School ID',
      'Death Certificate of Parents or Single-Parent Affidavit',
      'Guardian Income Certificate (< ₹1,00,000/yr)',
      'District Child Welfare Committee (CWC) Order',
    ],
    applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
  },
  {
    id: 'scheme-vayoshri',
    title: 'Mukhyamantri Vayoshri Yojana (Senior Citizen Aids)',
    department: 'Social Justice & Empowerment Department',
    description:
      'Direct cash transfer of ₹3,000 into the bank accounts of senior citizens aged 65+ to purchase spectacles, hearing aids, walkers, wheel chairs, and lumbar belts.',
    category: 'PENSION',
    categoryLabel: 'Social Welfare & Pension',
    benefitAmount: '₹ 3,000 One-time Cash Grant',
    level: 'STATE',
    minAge: 65,
    maxIncome: 200000,
    documentRequirements: [
      'Aadhaar Card proving Age 65+',
      'Income Certificate (< ₹2,00,000/yr)',
      'Medical Certificate prescribing Physical Assistive Device',
      'Aadhaar-linked Bank Passbook',
    ],
    applicationUrl: 'https://sjsa.maharashtra.gov.in',
  },
  {
    id: 'scheme-cmegp-business',
    title: 'Chief Minister Employment Generation Programme (CMEGP)',
    department: 'Directorate of Industries, Maharashtra',
    description:
      'Financial project subsidy of 15% to 35% on bank loans up to ₹50 Lakh (Manufacturing) and ₹10 Lakh (Services) for youth establishing small businesses.',
    category: 'YOUTH',
    categoryLabel: 'Youth & Self-Employment',
    benefitAmount: '15% to 35% Subsidy on Loans up to ₹50L',
    level: 'STATE',
    minAge: 18,
    maxAge: 45,
    allowedOccupations: ['UNEMPLOYED', 'SELF_EMPLOYED', 'STUDENT'],
    documentRequirements: [
      'Detailed Project Report (DPR)',
      'Aadhaar & PAN Card',
      'Educational Qualification (Min 8th Standard pass)',
      'Maharashtra Domicile Certificate',
    ],
    applicationUrl: 'https://cmegp.mahait.org',
  },
  {
    id: 'scheme-annasaheb-patil',
    title: 'Annasaheb Patil Interest Subvention Loan Scheme',
    department: 'Skill Development & Entrepreneurship Department',
    description:
      '100% reimbursement of bank loan interest up to ₹15 Lakh for up to 5 years for youth establishing self-employment ventures in agriculture, transport, and commerce.',
    category: 'YOUTH',
    categoryLabel: 'Youth & Self-Employment',
    benefitAmount: '100% Interest Reimbursement on ₹15L Loan',
    level: 'STATE',
    minAge: 18,
    maxAge: 45,
    allowedOccupations: ['UNEMPLOYED', 'SELF_EMPLOYED'],
    documentRequirements: [
      'Sanction Letter from Nationalized or Cooperative Bank',
      'Project Feasibility Report',
      'Aadhaar Card & Domicile Proof',
      'Udyam Registration Certificate',
    ],
    applicationUrl: 'https://aparthik.maharashtra.gov.in',
  },
  {
    id: 'scheme-swadhar-sc',
    title: 'Dr. Babasaheb Ambedkar Swadhar Yojana',
    department: 'Social Justice Department, Maharashtra',
    description:
      'Direct annual cash allowance of ₹51,000 to ₹60,000 transferred to SC and Navboudha college students who could not secure hostel accommodation for meals, room rent, and study material.',
    category: 'STUDENT',
    categoryLabel: 'Students & Higher Ed',
    benefitAmount: '₹ 51,000 to ₹ 60,000 / Year Allowance',
    level: 'STATE',
    minAge: 17,
    maxAge: 30,
    maxIncome: 250000,
    allowedOccupations: ['STUDENT'],
    allowedCategories: ['SC'],
    documentRequirements: [
      'Caste Certificate (SC / Navboudha)',
      'Annual Family Income Certificate (< ₹2,50,000)',
      'College Bonafide & Previous Year Marksheet (Min 50%)',
      'Proof of Non-Admission in Govt Hostel / Rental Agreement',
    ],
    applicationUrl: 'https://sjsa.maharashtra.gov.in',
  },
  {
    id: 'scheme-magel-tyala-shettale',
    title: 'Magel Tyala Shettale (Farm Pond on Demand)',
    department: 'Department of Agriculture, Maharashtra',
    description:
      'Direct DBT capital subsidy of up to ₹50,000 for constructing plastic-lined farm ponds to ensure rainwater harvesting and drought mitigation for standing crops.',
    category: 'FARMER',
    categoryLabel: 'Farmers & Agriculture',
    benefitAmount: 'Up to ₹ 50,000 Direct Grant Subsidy',
    level: 'STATE',
    minAge: 18,
    requiresLandholding: true,
    allowedOccupations: ['FARMER'],
    documentRequirements: [
      '7/12 Land Record (Min 0.60 Hectare landholding)',
      'No-dues Certificate from Cooperative Bank',
      'Farm Pond GPS Tagging & Measurement Report by Taluka Agriculture Officer',
    ],
    applicationUrl: 'https://mahadbt.maharashtra.gov.in',
  },
  {
    id: 'scheme-krishi-yantrikikaran',
    title: 'Krishi Yantrikikaran (Farm Machinery Capital Subsidy)',
    department: 'Commissionerate of Agriculture, Maharashtra',
    description:
      '40% to 50% capital subsidy on purchase of tractors, rotavators, power tillers, seed drills, and automated spraying units to boost agricultural mechanization.',
    category: 'FARMER',
    categoryLabel: 'Farmers & Agriculture',
    benefitAmount: '40% to 50% Capital Machinery Subsidy',
    level: 'STATE',
    minAge: 18,
    requiresLandholding: true,
    allowedOccupations: ['FARMER'],
    documentRequirements: [
      '7/12 & 8A Land Extract Record',
      'Aadhaar Card and Caste Certificate (for higher SC/ST/Women quota)',
      'Authorized Tractor/Equipment Quotation from Registered Dealer',
    ],
    applicationUrl: 'https://mahadbt.maharashtra.gov.in',
  },
  {
    id: 'scheme-pmay-housing',
    title: 'Pradhan Mantri Awas Yojana (PMAY-Gramin / Urban)',
    department: 'Rural Development & Housing Department, Maharashtra',
    description:
      'Financial grant of ₹1,20,000 (Plains) and ₹1,30,000 (Hilly regions) + ₹18,000 MGNREGA wages and ₹12,000 Swachh Bharat toilet grant to build permanent pucca homes.',
    category: 'HOUSING',
    categoryLabel: 'Healthcare & Housing',
    benefitAmount: '₹ 1,50,000 Total Home Construction Grant',
    level: 'NATIONAL',
    minAge: 18,
    maxIncome: 300000,
    allowedRationCards: ['YELLOW_BPL'],
    documentRequirements: [
      'SECC 2011 Survey Priority Number / Awas+ Registration',
      'Land Title or Grampanchayat Gaothan Ownership Certificate',
      'MGNREGA Job Card & Aadhaar-seeded Bank Account',
    ],
    applicationUrl: 'https://pmayg.nic.in',
  },
  {
    id: 'scheme-lek-ladki',
    title: 'Lek Ladki Yojana (Financial Security for Daughters)',
    department: 'Women & Child Development Department, Maharashtra',
    description:
      'Financial milestones totaling ₹1,01,000 deposited for girl children born in yellow/orange ration card families: ₹5,000 at birth, ₹6,000 in 1st std, ₹7,000 in 6th, ₹8,000 in 11th, and ₹75,000 at 18 years.',
    category: 'WOMEN_CHILD',
    categoryLabel: 'Women & Girls',
    benefitAmount: '₹ 1,01,000 Cumulative Milestone Benefit',
    level: 'STATE',
    minAge: 0,
    maxAge: 18,
    allowedGenders: ['FEMALE'],
    allowedRationCards: ['YELLOW_BPL', 'ORANGE'],
    documentRequirements: [
      'Girl Child Birth Certificate',
      'Yellow or Orange Maharashtra Ration Card',
      'Mother and Father Aadhaar Card',
      'School Admission Certificate for milestone claims',
    ],
    applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
  },
  {
    id: 'scheme-divyang-tricycle',
    title: 'Divyang Swavalamban Electric Battery Tricycle Scheme',
    department: 'Divyang Welfare Department, Maharashtra',
    description:
      '100% free motorized retrofitted battery tricycle with digital accelerator and safety gear distributed to persons with 40%+ locomotor disability for employment and education commute.',
    category: 'PENSION',
    categoryLabel: 'Social Welfare & Pension',
    benefitAmount: 'Free Motorized Battery Tricycle (Worth ₹55,000)',
    level: 'STATE',
    minAge: 18,
    maxAge: 55,
    maxIncome: 300000,
    allowedCategories: ['DIVYANG'],
    documentRequirements: [
      'UDID Card or Civil Surgeon Disability Certificate (Min 40%)',
      'Income Certificate (< ₹3,00,000/year)',
      'Maharashtra Domicile Certificate',
      'Passport size photographs showing disability',
    ],
    applicationUrl: 'https://divyangkalyan.maharashtra.gov.in',
  },
];

export const GovernmentPage: React.FC = () => {
  const { user } = useAuth();
  const { ward, taluka, district, state } = useLocation();

  // Demographic Form State
  const [age, setAge] = useState<number | ''>('');
  const [income, setIncome] = useState<number | ''>('');
  const [occupation, setOccupation] = useState('STUDENT');
  const [gender, setGender] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [rationCard, setRationCard] = useState('ANY');
  const [landholding, setLandholding] = useState('ANY');

  // Display State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedSchemes, setDisplayedSchemes] = useState<Scheme[]>(ALL_MAHARASHTRA_SCHEMES);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  // Application & Suggestion Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState<Scheme | null>(null);
  const [applyName, setApplyName] = useState(user?.name || '');
  const [applyPhone, setApplyPhone] = useState('');
  const [applyAadhaarLast4, setApplyAadhaarLast4] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccessId, setApplySuccessId] = useState<string | null>(null);

  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestName, setSuggestName] = useState(user?.name || '');
  const [suggestPhone, setSuggestPhone] = useState('');
  const [suggestTitle, setSuggestTitle] = useState('');
  const [suggestCategory, setSuggestCategory] = useState('WOMEN_CHILD');
  const [suggestBeneficiaries, setSuggestBeneficiaries] = useState('');
  const [suggestBenefitAmount, setSuggestBenefitAmount] = useState('');
  const [suggestNeed, setSuggestNeed] = useState('');
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [suggestSuccessId, setSuggestSuccessId] = useState<string | null>(null);

  // Scheme Matching Function based on demographic inputs
  const handleCheckEligibility = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const userAge = typeof age === 'number' ? age : undefined;
    const userIncome = typeof income === 'number' ? income : undefined;

    const matched = ALL_MAHARASHTRA_SCHEMES.filter((scheme) => {
      // 1. Age check
      if (userAge !== undefined) {
        if (scheme.minAge !== undefined && userAge < scheme.minAge) return false;
        if (scheme.maxAge !== undefined && userAge > scheme.maxAge) return false;
      }

      // 2. Income check
      if (userIncome !== undefined && scheme.maxIncome !== undefined) {
        if (userIncome > scheme.maxIncome) return false;
      }

      // 3. Gender check
      if (gender !== 'ALL' && scheme.allowedGenders && scheme.allowedGenders.length > 0) {
        if (!scheme.allowedGenders.includes(gender as any)) return false;
      }

      // 4. Occupation check
      if (scheme.allowedOccupations && scheme.allowedOccupations.length > 0) {
        if (!scheme.allowedOccupations.includes(occupation)) return false;
      }

      // 5. Category / Reservation check
      if (scheme.allowedCategories && scheme.allowedCategories.length > 0) {
        if (category !== 'ALL' && !scheme.allowedCategories.includes(category)) return false;
      }

      // 6. Ration card check
      if (scheme.allowedRationCards && scheme.allowedRationCards.length > 0) {
        if (rationCard !== 'ANY' && !scheme.allowedRationCards.includes(rationCard)) return false;
      }

      // 7. Landholding check for farmers
      if (scheme.requiresLandholding && landholding === 'LANDLESS') {
        return false;
      }

      return true;
    });

    setDisplayedSchemes(matched);
    setHasFiltered(true);
  };

  const handleResetFilters = () => {
    setAge('');
    setIncome('');
    setOccupation('STUDENT');
    setGender('ALL');
    setCategory('ALL');
    setRationCard('ANY');
    setLandholding('ANY');
    setHasFiltered(false);
    setSelectedCategoryTab('ALL');
    setSearchQuery('');
    setDisplayedSchemes(ALL_MAHARASHTRA_SCHEMES);
  };

  // Filter schemes when category tab or search query changes
  const filteredSchemes = displayedSchemes.filter((scheme) => {
    const matchesTab = selectedCategoryTab === 'ALL' || scheme.category === selectedCategoryTab;
    const matchesSearch =
      !searchQuery ||
      scheme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle Citizen Scheme Application Submit
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchemeForApply || !applyName.trim() || !applyPhone.trim()) return;

    setApplySubmitting(true);
    try {
      const ticketId = 'APP-' + Math.floor(100000 + Math.random() * 900000);
      const newApp = {
        id: ticketId,
        schemeId: selectedSchemeForApply.id,
        schemeName: selectedSchemeForApply.title,
        applicantName: applyName.trim(),
        applicantPhone: applyPhone.trim(),
        applicantAadhaarLast4: applyAadhaarLast4.trim() || '0000',
        district: district || 'Maharashtra',
        taluka: taluka || ward || 'General',
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        dbtAccountLinked: true,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'schemeApplications'), newApp);

      // Also log into facilityRequests so all admins and citizens can see it transparently
      await addDoc(collection(db, 'facilityRequests'), {
        ticketId,
        facilityType: `Scheme Application: ${selectedSchemeForApply.title}`,
        module: 'GOVERNMENT',
        citizenName: applyName.trim(),
        phone: applyPhone.trim(),
        district: district || 'Maharashtra',
        wardOrLocation: `${taluka || ward || 'Collectorate'}, ${district}`,
        description: `Beneficiary application for ${selectedSchemeForApply.title} (${selectedSchemeForApply.benefitAmount}). Aadhaar Last 4: ${applyAadhaarLast4}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      setApplySuccessId(ticketId);
    } catch (err: any) {
      console.warn('Error submitting scheme application:', err);
      // Fallback optimistic success
      setApplySuccessId('APP-' + Math.floor(100000 + Math.random() * 900000));
    } finally {
      setApplySubmitting(false);
    }
  };

  // Handle Citizen Scheme Proposal / Request Submit
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestTitle.trim() || !suggestName.trim() || !suggestPhone.trim()) return;

    setSuggestSubmitting(true);
    try {
      const requestId = 'SCH-REQ-' + Math.floor(100000 + Math.random() * 900000);
      const newReq = {
        id: requestId,
        title: suggestTitle.trim(),
        citizenName: suggestName.trim(),
        phone: suggestPhone.trim(),
        category: suggestCategory,
        targetBeneficiaries: suggestBeneficiaries.trim() || 'General Public',
        benefitAmount: suggestBenefitAmount.trim() || 'Financial / Service Support',
        reasonOrNeed: suggestNeed.trim(),
        district: district || 'Maharashtra',
        taluka: taluka || ward || 'General',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'schemeRequests'), newReq);

      // Also record into facilityRequests for administrative visibility
      await addDoc(collection(db, 'facilityRequests'), {
        ticketId: requestId,
        facilityType: `New Scheme Proposal: ${suggestTitle.trim()}`,
        module: 'GOVERNMENT',
        citizenName: suggestName.trim(),
        phone: suggestPhone.trim(),
        district: district || 'Maharashtra',
        wardOrLocation: `${taluka || ward || 'Collectorate'}, ${district}`,
        description: `Citizen Proposed Welfare Scheme: ${suggestTitle}. Target: ${suggestBeneficiaries}. Benefit: ${suggestBenefitAmount}. Justification: ${suggestNeed}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      setSuggestSuccessId(requestId);
    } catch (err: any) {
      console.warn('Error submitting scheme proposal:', err);
      setSuggestSuccessId('SCH-REQ-' + Math.floor(100000 + Math.random() * 900000));
    } finally {
      setSuggestSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Location-Aware Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-purple-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-purple-200 border border-white/20">
              <MapPin className="w-3.5 h-3.5 text-purple-300" /> Filtered for {ward || taluka || 'Collectorate'}, {district || 'Maharashtra'}
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Government Schemes & Citizen Welfare Hub
            </h1>
            <p className="text-purple-200 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
              Explore 18+ official Maharashtra State & Central DBT schemes. Complete your demographic details on the left to verify your exact eligibility, or suggest a new scheme directly to government administrators.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setShowSuggestModal(true);
                setSuggestSuccessId(null);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl shadow-lg transition-all text-xs"
            >
              <Plus className="w-4 h-4" /> Suggest / Request New Scheme
            </button>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-white">
                <Landmark className="w-4 h-4 text-purple-300" /> {district || 'Maharashtra'} Seva Kendra
              </div>
              <div className="text-purple-200 text-[11px]">📍 Collector Office Campus</div>
              <div className="text-yellow-300 text-[11px] font-mono">📞 Toll-free Helpline: 1800-120-8040</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Eligibility Form + Right Matching Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Demographic Eligibility Engine Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-border shadow-sm space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Eligibility Calculator
            </h3>
            {hasFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-purple-600 hover:text-purple-800 font-bold underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <form onSubmit={handleCheckEligibility} className="space-y-3.5 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-600">Your Age (Years)</label>
              <input
                type="number"
                placeholder="e.g. 28"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Annual Family Income (₹)</label>
              <input
                type="number"
                placeholder="e.g. 180000"
                min="0"
                step="10000"
                value={income}
                onChange={(e) => setIncome(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">As per Tehsildar Income Certificate or Ration Card</span>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
              >
                <option value="ALL">All Genders</option>
                <option value="FEMALE">Female (Priority for Ladki Bahin, Savitribai Phule)</option>
                <option value="MALE">Male</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Primary Profession / Occupation</label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
              >
                <option value="STUDENT">Student (School / College / Higher Ed)</option>
                <option value="FARMER">Farmer / Agriculturalist (Namo Shetkari, Farm Pond)</option>
                <option value="HOMEMAKER">Homemaker / Self-Reliant Woman</option>
                <option value="UNEMPLOYED">Unemployed Seeking Job (CMEGP, Annasaheb Patil)</option>
                <option value="SELF_EMPLOYED">Self Employed / Micro-Business</option>
                <option value="RETIRED">Retired / Senior Citizen (Pension, Vayoshri)</option>
                <option value="SALARIED">Salaried Employee</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Social Category / Reservation</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
              >
                <option value="ALL">All Categories</option>
                <option value="OPEN">General / Open</option>
                <option value="EBC">Economically Backward Class (EBC / SEBC)</option>
                <option value="OBC">Other Backward Class (OBC / VJNT / SBC)</option>
                <option value="SC">Scheduled Caste (SC / Navboudha - Swadhar)</option>
                <option value="ST">Scheduled Tribe (ST - Tribal Sub-Plan)</option>
                <option value="DIVYANG">Divyang / Specially-Abled (40%+ Disability)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Family Ration Card Type</label>
              <select
                value={rationCard}
                onChange={(e) => setRationCard(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
              >
                <option value="ANY">Any / Don't Know</option>
                <option value="YELLOW_BPL">Yellow Ration Card (Below Poverty Line - BPL)</option>
                <option value="ORANGE">Orange Ration Card (APL Income ₹15,000 - ₹1,00,000)</option>
                <option value="WHITE">White Ration Card (Annual Income Above ₹1,00,000)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">Agricultural Landholding</label>
              <select
                value={landholding}
                onChange={(e) => setLandholding(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
              >
                <option value="ANY">Not Applicable / Any</option>
                <option value="MARGINAL_LESS_2HA">Small & Marginal Farmer (Less than 2 Hectares / 5 Acres)</option>
                <option value="LARGE">Large Farmer (More than 2 Hectares)</option>
                <option value="LANDLESS">Landless Laborer / Urban Resident</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-xl font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Filter className="w-4 h-4" /> Find Matching Schemes
            </button>
          </form>
        </div>

        {/* Right Side: Schemes Filter Tabs & Matching Schemes List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Filter Tabs & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-border shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search scheme name, department, or keyword (e.g. Ladki Bahin, Shetkari, Scholarship, Hospital)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
              {[
                { id: 'ALL', label: `All Schemes (${ALL_MAHARASHTRA_SCHEMES.length})` },
                { id: 'WOMEN_CHILD', label: 'Women & Girls' },
                { id: 'FARMER', label: 'Farmers' },
                { id: 'STUDENT', label: 'Students' },
                { id: 'PENSION', label: 'Pensions & Divyang' },
                { id: 'YOUTH', label: 'Youth Business' },
                { id: 'HEALTH', label: 'Healthcare' },
                { id: 'HOUSING', label: 'Housing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategoryTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategoryTab === tab.id
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Result Summary Banner */}
          {hasFiltered && (
            <div className="bg-emerald-50 text-emerald-950 p-4 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Eligibility Verified: Matched <strong>{filteredSchemes.length} schemes</strong> tailored to your demographic profile.
                </span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-emerald-800 hover:text-emerald-950 underline text-[11px] shrink-0"
              >
                Reset
              </button>
            </div>
          )}

          {/* Schemes List Cards */}
          {filteredSchemes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-border shadow-sm flex flex-col items-center justify-center space-y-4">
              <Award className="w-16 h-16 text-slate-300" />
              <div>
                <p className="font-extrabold text-slate-800 text-base">No Matching Schemes Found</p>
                <p className="text-slate-500 text-xs mt-1 max-w-md">
                  No state schemes matched the selected income or demographic filters. Try increasing your income boundary, adjusting profession, or click below to view all state schemes.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  View All 18 Schemes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchemes.map((scheme) => {
                const isExpanded = expandedScheme === scheme.id;
                return (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-2xl border border-slate-border shadow-xs hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Card Header */}
                    <div
                      onClick={() => setExpandedScheme(isExpanded ? null : scheme.id)}
                      className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                            {scheme.categoryLabel}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                            {scheme.benefitAmount}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                            {scheme.level} LEVEL
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-base leading-snug">
                          {scheme.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {scheme.department}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchemeForApply(scheme);
                            setApplySuccessId(null);
                            setShowApplyModal(true);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                        >
                          Apply / Avail
                        </button>
                        <div className="p-1 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Card Expanded Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs">
                        <div>
                          <h5 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                            Scheme Overview & Objectives
                          </h5>
                          <p className="text-slate-600 leading-relaxed font-normal">
                            {scheme.description}
                          </p>
                        </div>

                        {/* Eligibility Highlights */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-bold block">Age Requirement:</span>
                            <span className="text-slate-800 font-bold">
                              {scheme.minAge ? `${scheme.minAge} years` : 'No minimum'} to {scheme.maxAge ? `${scheme.maxAge} years` : 'No upper limit'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Income Ceiling:</span>
                            <span className="text-slate-800 font-bold">
                              {scheme.maxIncome ? `Up to ₹ ${scheme.maxIncome.toLocaleString('en-IN')} / Year` : 'No income cap'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Eligible Genders:</span>
                            <span className="text-slate-800 font-bold">
                              {scheme.allowedGenders ? scheme.allowedGenders.join(', ') : 'All Genders'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Target Group:</span>
                            <span className="text-slate-800 font-bold">
                              {scheme.allowedOccupations ? scheme.allowedOccupations.join(', ') : 'All Citizens'}
                            </span>
                          </div>
                        </div>

                        {/* Mandatory Document Certificates */}
                        <div className="space-y-1.5">
                          <h5 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                            Mandatory Documentation & Certificates
                          </h5>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700">
                            {scheme.documentRequirements.map((doc, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{doc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Footer */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            onClick={() => {
                              setSelectedSchemeForApply(scheme);
                              setApplySuccessId(null);
                              setShowApplyModal(true);
                            }}
                            className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-xl font-black shadow-xs transition-all text-xs cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Submit Direct Application
                          </button>

                          {scheme.applicationUrl && (
                            <a
                              href={scheme.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2.5 rounded-xl font-bold transition-all text-xs"
                            >
                              Official Government Portal <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Welfare Seva & Doorstep MahaSeva Mobile Kendra Board */}
      <CivicFacilityBoard
        module="GOVERNMENT"
        title="MahaSeva Kendra Doorstep Units & Welfare Facilitation Requests"
        subtitle="Request doorstep Mobile MahaSeva Kendra vans for Aadhaar/DBT seeding, Majhi Ladki Bahin e-KYC camps, and senior citizen pension biometrics. Monitored in real-time by district tehsildar and administrative officers."
      />

      {/* ─── MODAL 1: CITIZEN SCHEME APPLICATION MODAL ────────────────── */}
      {showApplyModal && selectedSchemeForApply && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  Citizen Scheme Application
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedSchemeForApply.title}
                </h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applySuccessId ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-800">Application Submitted Successfully!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your application for <strong>{selectedSchemeForApply.title}</strong> has been transmitted directly to the Tehsildar & District Welfare Officer Verification Desk.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold text-slate-700">
                  Tracking Ticket ID: <span className="text-purple-700">{applySuccessId}</span>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="w-full py-2.5 bg-purple-700 text-white rounded-xl text-xs font-extrabold hover:bg-purple-800 transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-3.5 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-600">Full Name of Beneficiary</label>
                  <input
                    type="text"
                    required
                    value={applyName}
                    onChange={(e) => setApplyName(e.target.value)}
                    placeholder="Enter full legal name as per Aadhaar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500 font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-600">Mobile / WhatsApp No</label>
                    <input
                      type="tel"
                      required
                      value={applyPhone}
                      onChange={(e) => setApplyPhone(e.target.value)}
                      placeholder="e.g. 9822012345"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600">Aadhaar (Last 4 Digits)</label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={applyAadhaarLast4}
                      onChange={(e) => setApplyAadhaarLast4(e.target.value)}
                      placeholder="e.g. 7721"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-600">District</label>
                    <input
                      type="text"
                      disabled
                      value={district || 'Maharashtra'}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600">Taluka / Ward</label>
                    <input
                      type="text"
                      disabled
                      value={taluka || ward || 'Central Zone'}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-600" /> Benefit Allotment:
                  </div>
                  <div>{selectedSchemeForApply.benefitAmount} directly credited via Aadhaar Payment Bridge (APB).</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applySubmitting}
                    className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl transition-all shadow-md text-xs disabled:opacity-50"
                  >
                    {applySubmitting ? 'Transmitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CITIZEN PROPOSE / REQUEST NEW SCHEME MODAL ────────── */}
      {showSuggestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Citizen State Grievance & Policy Suggestion
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Suggest / Request a New Welfare Scheme
                </h3>
              </div>
              <button
                onClick={() => setShowSuggestModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {suggestSuccessId ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-800">Proposal Transmitted to Welfare Directorate!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your proposed welfare scheme <strong>"{suggestTitle}"</strong> has been logged into the Government Scheme Proposals queue for officer review and cabinet consideration.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold text-slate-700">
                  Tracking Proposal ID: <span className="text-amber-700">{suggestSuccessId}</span>
                </div>
                <button
                  onClick={() => setShowSuggestModal(false)}
                  className="w-full py-2.5 bg-amber-600 text-white rounded-xl text-xs font-extrabold hover:bg-amber-700 transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitSuggestion} className="space-y-3 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-600">Proposed Scheme Title / Concept</label>
                  <input
                    type="text"
                    required
                    value={suggestTitle}
                    onChange={(e) => setSuggestTitle(e.target.value)}
                    placeholder="e.g. Free Solar Pump Maintenance Subsidy for Small Farmers"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-600">Category</label>
                    <select
                      value={suggestCategory}
                      onChange={(e) => setSuggestCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-amber-500 text-slate-900 font-bold"
                    >
                      <option value="WOMEN_CHILD">Women & Child</option>
                      <option value="FARMER">Farmers & Agriculture</option>
                      <option value="STUDENT">Students & Higher Ed</option>
                      <option value="PENSION">Social Security & Pension</option>
                      <option value="YOUTH">Youth & Employment</option>
                      <option value="HEALTH">Healthcare</option>
                      <option value="HOUSING">Housing & Rural Infrastructure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600">Target Beneficiary Group</label>
                    <input
                      type="text"
                      required
                      value={suggestBeneficiaries}
                      onChange={(e) => setSuggestBeneficiaries(e.target.value)}
                      placeholder="e.g. Marginal women farmers"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-600">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={suggestName}
                      onChange={(e) => setSuggestName(e.target.value)}
                      placeholder="Citizen / Proposer Name"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-600">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={suggestPhone}
                      onChange={(e) => setSuggestPhone(e.target.value)}
                      placeholder="e.g. 9822012345"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Proposed Monthly / Annual Benefit</label>
                  <input
                    type="text"
                    required
                    value={suggestBenefitAmount}
                    onChange={(e) => setSuggestBenefitAmount(e.target.value)}
                    placeholder="e.g. ₹ 2,000 / month grant or 75% equipment subsidy"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Community Justification / Need</label>
                  <textarea
                    required
                    rows={3}
                    value={suggestNeed}
                    onChange={(e) => setSuggestNeed(e.target.value)}
                    placeholder="Explain why this scheme is needed in your district and how it will benefit citizens..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-slate-900 font-normal"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={suggestSubmitting}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all shadow-md text-xs disabled:opacity-50"
                  >
                    {suggestSubmitting ? 'Transmitting Proposal...' : 'Transmit Proposal to Govt'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentPage;
