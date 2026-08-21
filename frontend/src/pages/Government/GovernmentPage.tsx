import React, { useState } from 'react';
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
  Sparkles,
  Search,
  Bot,
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { queryGovernmentSchemeAI } from '../../services/aiService.ts';

interface Scheme {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'WARD' | 'TALUKA' | 'DISTRICT' | 'STATE' | 'NATIONAL';
  benefitAmount: string;
  documentRequirements: string[];
  eligibilitySummary: string;
  applicationUrl: string;
  helpline: string;
}

export const GovernmentPage: React.FC = () => {
  const { ward, taluka, district, state } = useLocation();
  const [age, setAge] = useState<number | ''>('');
  const [income, setIncome] = useState<number | ''>('');
  const [occupation, setOccupation] = useState('ALL');
  const [gender, setGender] = useState('ALL');
  const [residency, setResidency] = useState('MAHARASHTRA');

  const [eligibleSchemes, setEligibleSchemes] = useState<Scheme[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  // Gemini AI Custom Scheme Advisor State
  const [aiAdvisorResult, setAiAdvisorResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Comprehensive Maharashtra & National Government Schemes Database
  const comprehensiveSchemes: Scheme[] = [
    {
      id: 'scheme-ladki-bahin',
      title: 'Mukhyamantri Majhi Ladki Bahin Yojana',
      description:
        'Financial independence grant of ₹1,500 per month directly transferred to bank account for eligible women aged 21 to 65 years across Maharashtra.',
      category: 'Women & Child Welfare',
      level: 'STATE',
      benefitAmount: '₹1,500 / Month (₹18,000 / Year)',
      documentRequirements: [
        'Aadhaar Card (Linked with Bank A/C)',
        'Maharashtra Domicile Certificate / Birth Certificate',
        'Income Certificate (< ₹2,50,000 / Year) or Ration Card (Yellow/Orange)',
        'Self-Declaration Form',
        'Bank Passbook Copy',
      ],
      eligibilitySummary: 'Women aged 21-65 years, Domicile of Maharashtra, Family Income < ₹2.5 Lakh/yr.',
      applicationUrl: 'https://ladkibahin.maharashtra.gov.in',
      helpline: '181 / Setu Kendra',
    },
    {
      id: 'scheme-namo-shetkari',
      title: 'PM-Kisan & Namo Shetkari MahaSanman Nidhi',
      description:
        'Combined central and state financial assistance providing ₹12,000 per year directly to farmer bank accounts for agricultural inputs.',
      category: 'Agriculture & Farmer Welfare',
      level: 'NATIONAL',
      benefitAmount: '₹12,000 / Year in 4 Installments',
      documentRequirements: [
        '7/12 & 8A Land Extract Record',
        'Aadhaar Card (e-KYC verified)',
        'Bank Account Aadhaar Seeding Proof',
        'Farmer Registration ID',
      ],
      eligibilitySummary: 'Land-holding farmers in Maharashtra with valid 7/12 land records.',
      applicationUrl: 'https://pmkisan.gov.in',
      helpline: '155261 / 1800-115-526',
    },
    {
      id: 'scheme-sanjay-gandhi',
      title: 'Sanjay Gandhi Niradhar Anudan Yojana',
      description:
        'Monthly pension grant of ₹1,500 for destitute persons, widows, abandoned women, disabled individuals, and persons suffering from critical illness.',
      category: 'Social Welfare & Pension',
      level: 'STATE',
      benefitAmount: '₹1,500 / Month',
      documentRequirements: [
        'Income Certificate (< ₹50,000 / Year)',
        'Age Proof (Minimum 18 Years)',
        'Disability Certificate (min 40% if applying under disability category)',
        'Maharashtra Domicile Certificate',
      ],
      eligibilitySummary: 'Destitute, disabled, or widowed citizens with annual family income below ₹50,000.',
      applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
      helpline: '1800-120-8040',
    },
    {
      id: 'scheme-shahu-maharaj',
      title: 'Rajarshi Chhatrapati Shahu Maharaj Tuition Fee Scholarship',
      description:
        '50% to 100% tuition and exam fee reimbursement for Economically Backward Class (EBC) students pursuing professional higher education.',
      category: 'Education & Student Welfare',
      level: 'STATE',
      benefitAmount: '50% - 100% Tuition Fee Waiver',
      documentRequirements: [
        'Income Certificate (< ₹8,00,000 / Year)',
        'Maharashtra Domicile Certificate',
        'Aadhaar Linked Bank Account',
        'College Admission & Fee Receipt',
        'Previous Academic Marksheet',
      ],
      eligibilitySummary: 'EBC students pursuing diploma/degree professional courses with income < ₹8 Lakh.',
      applicationUrl: 'https://mahadbt.maharashtra.gov.in',
      helpline: '022-49150800',
    },
    {
      id: 'scheme-lek-ladki',
      title: 'Lek Ladki Yojana (Girl Child Financial Assistance)',
      description:
        'Step-by-step financial support up to ₹1,01,000 provided at birth, Class 1, Class 6, Class 11, and age 18 for yellow/orange ration card families.',
      category: 'Girl Child Welfare',
      level: 'STATE',
      benefitAmount: 'Up to ₹1,01,000 Cumulative Grant',
      documentRequirements: [
        'Birth Certificate of Girl Child',
        'Yellow or Orange Ration Card',
        'Parents Aadhaar Card & Domicile',
        'Bank Account Passbook',
      ],
      eligibilitySummary: 'Girl children born in yellow/orange ration card holding families in Maharashtra.',
      applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
      helpline: '1800-120-8040',
    },
    {
      id: 'scheme-cmegp',
      title: 'Chief Minister Employment Generation Programme (CMEGP)',
      description:
        'Credit-linked subsidy project loans up to ₹50 Lakh for manufacturing and ₹10 Lakh for service enterprises with 15% to 35% government subsidy.',
      category: 'Employment & Business Subsidies',
      level: 'STATE',
      benefitAmount: 'Up to ₹50 Lakh Loan with 15-35% Subsidy',
      documentRequirements: [
        'Project Report / Detailed Estimate',
        'Aadhaar Card & PAN Card',
        'Educational / Skill Training Certificate',
        'Category / Caste Certificate (if claiming special subsidy)',
      ],
      eligibilitySummary: 'Maharashtra residents aged 18-45 years establishing new self-employment units.',
      applicationUrl: 'https://cmegp.mahait.org',
      helpline: '022-22026408',
    },
    {
      id: 'scheme-bal-sangopan',
      title: 'Maharashtra Bal Sangopan Yojana',
      description:
        'Monthly foster care financial aid of ₹2,250 per month for foster parents or guardians supporting orphans, single-parent, or vulnerable children.',
      category: 'Child Welfare',
      level: 'STATE',
      benefitAmount: '₹2,250 / Month per Child',
      documentRequirements: [
        'Child Birth Certificate',
        'Death Certificate of Parent(s) or Guardian proof',
        'Income Certificate (< ₹1,00,000 / Year)',
        'Guardian Aadhaar & Bank Passbook',
      ],
      eligibilitySummary: 'Orphans or single-parent children under foster care in Maharashtra.',
      applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
      helpline: '1098 / 1800-120-8040',
    },
  ];

  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setAiAdvisorResult(null);

    const userIncome = typeof income === 'number' ? income : 1000000;
    const userAge = typeof age === 'number' ? age : 25;

    // 1. Filter local structured database
    const filtered = comprehensiveSchemes.filter((scheme) => {
      if (scheme.id === 'scheme-ladki-bahin') return gender !== 'MALE' && userAge >= 21 && userAge <= 65 && userIncome <= 250000;
      if (scheme.id === 'scheme-sanjay-gandhi') return userIncome <= 50000;
      if (scheme.id === 'scheme-shahu-maharaj') return userIncome <= 800000 && occupation === 'STUDENT';
      if (scheme.id === 'scheme-cmegp') return userAge >= 18 && userAge <= 45;
      return true;
    });

    setEligibleSchemes(filtered.length > 0 ? filtered : comprehensiveSchemes);
    setChecking(false);
    setHasChecked(true);

    // 2. Fetch Gemini AI Scheme Advisor breakdown
    setAiLoading(true);
    const aiText = await queryGovernmentSchemeAI(userIncome, userAge, occupation, district);
    setAiAdvisorResult(aiText);
    setAiLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedScheme(expandedScheme === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Location-Aware Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 mb-2 border border-white/20">
              <MapPin className="w-3.5 h-3.5" /> Aaple Sarkar Setu Portal for {ward || taluka}, {district} District
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Maharashtra Government Welfare & Setu Kendra Portal
            </h1>
            <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Explore state welfare schemes, verify certificate requirements, check eligibility, and apply directly via official Aaple Sarkar & MahaDBT Setu portals for <strong className="text-white font-bold">{district}</strong>.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-1 shrink-0">
            <div className="font-bold flex items-center gap-1.5 text-white">
              <Landmark className="w-4 h-4 text-teal-300" /> {district} Setu Seva Kendra
            </div>
            <div className="text-teal-100 text-[11px]">📍 Collector Office Campus, {district}</div>
            <div className="text-teal-200 text-[11px] font-mono">📞 Toll-Free Helpline: 1800-120-8040</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Demographic Eligibility Filter Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-700" /> Scheme Eligibility Finder
          </h3>

          <form onSubmit={handleCheckEligibility} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="e.g. 28"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Annual Family Income (₹)</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="e.g. 150000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Profession</label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold outline-none"
              >
                <option value="ALL">All Professions</option>
                <option value="FARMER">Farmer / Agriculturalist</option>
                <option value="STUDENT">Student</option>
                <option value="WOMEN_HOMEMAKER">Women / Homemaker</option>
                <option value="UNEMPLOYED">Unemployed Youth</option>
                <option value="SALARIED">Salaried Employee</option>
                <option value="SELF_EMPLOYED">Business / Self Employed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold outline-none"
              >
                <option value="ALL">All Genders</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={checking}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {checking ? (
                'Checking Portal...'
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-300" /> Search Eligible Schemes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Schemes & Gemini AI Advisory Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gemini AI Scheme Breakdown Box */}
          {aiAdvisorResult && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-3xl border border-teal-200 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-teal-900 text-sm flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-700" /> Gemini AI Government Welfare Analysis ({district})
                </h3>
                <span className="text-[10px] font-black bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full uppercase">
                  Live AI Advisory
                </span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/80 p-4 rounded-2xl border border-teal-100">
                {aiAdvisorResult}
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-center text-xs text-teal-800 font-semibold flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
              Gemini AI is analyzing Maharashtra & Central welfare databases...
            </div>
          )}

          {/* Scheme Cards */}
          <div className="space-y-4">
            <div className="bg-emerald-50 text-emerald-900 p-4 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Showing {hasChecked ? eligibleSchemes.length : comprehensiveSchemes.length} verified government welfare schemes
              </span>
              <a
                href="https://aaplesarkar.maharashtra.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 hover:underline flex items-center gap-1 text-[11px]"
              >
                Aaple Sarkar Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {(hasChecked ? eligibleSchemes : comprehensiveSchemes).map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300"
              >
                <div
                  onClick={() => toggleExpand(scheme.id)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                        {scheme.category}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black">
                        {scheme.benefitAmount}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-base">{scheme.title}</h4>
                  </div>
                  {expandedScheme === scheme.id ? (
                    <ChevronUp className="text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="text-slate-400 shrink-0" />
                  )}
                </div>

                {expandedScheme === scheme.id && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4 bg-slate-50/60 text-xs">
                    <p className="text-slate-700 leading-relaxed font-medium">{scheme.description}</p>

                    <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-800">Eligibility Summary:</span>
                      <p className="text-slate-600 text-[11px]">{scheme.eligibilitySummary}</p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-700" /> Mandatory Document Checklist
                      </h5>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                        {scheme.documentRequirements.map((doc, idx) => (
                          <li key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                            <span className="w-1.5 h-1.5 bg-teal-600 rounded-full shrink-0"></span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Helpline: <strong className="text-slate-800 font-mono">{scheme.helpline}</strong>
                      </span>
                      <a
                        href={scheme.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all"
                      >
                        Apply Online via Setu Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentPage;
