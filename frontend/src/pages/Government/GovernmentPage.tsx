import React, { useState } from 'react';
import { Award, FileText, CheckCircle, Info, ChevronDown, ChevronUp, MapPin, Building2, Landmark, Clock, ExternalLink } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';

interface Scheme {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'WARD' | 'TALUKA' | 'DISTRICT' | 'STATE' | 'NATIONAL';
  documentRequirements: string[];
  applicationUrl?: string;
  eligibilityCriteria?: any;
}

const GovernmentPage: React.FC = () => {
  const { ward, taluka, district, state } = useLocation();
  const [age, setAge] = useState<number | ''>('');
  const [income, setIncome] = useState<number | ''>('');
  const [occupation, setOccupation] = useState('STUDENT');
  const [gender, setGender] = useState('ALL');
  const [residency, setResidency] = useState('MAHARASHTRA');

  const [eligibleSchemes, setEligibleSchemes] = useState<Scheme[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  // Mock list for offline checker fallback
  const fallbackSchemes: Scheme[] = [
    {
      id: 'scheme-1',
      title: 'Sanjay Gandhi Niradhar Pension Yojana',
      description: 'Financial assistance of ₹1,500/month to destitute persons, blind, disabled, orphans, and persons suffering from major illnesses.',
      category: 'Social Welfare',
      level: 'STATE',
      documentRequirements: ['Age Proof', 'Income Certificate (< ₹50,000/yr)', 'Disability Certificate (if applicable)', 'Maharashtra Residence Proof'],
      applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
    },
    {
      id: 'scheme-2',
      title: 'Rajarshi Chhatrapati Shahu Maharaj Fee Reimbursement',
      description: '50% tuition fee reimbursement for students of EBC category enrolled in professional courses.',
      category: 'Education',
      level: 'STATE',
      documentRequirements: ['Income Certificate (< ₹8,00,000/yr)', 'Aadhaar Card', 'Domicile Certificate', 'College Fee Receipt'],
      applicationUrl: 'https://mahadbt.maharashtra.gov.in',
    },
    {
      id: 'scheme-3',
      title: 'Maharashtra Bal Sangopan Yojana',
      description: 'Financial aid of ₹1,125 per month for foster parents to support education and nutrition of orphans and single-parent children.',
      category: 'Child Development',
      level: 'STATE',
      documentRequirements: ['Birth Certificate', 'Income Certificate', 'Single Parent/Death Certificate'],
      applicationUrl: 'https://aaplesarkar.maharashtra.gov.in',
    },
  ];

  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (age === '' || income === '') return;

    setChecking(true);
    try {
      const response = await fetch('/api/schemes/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age,
          annualIncome: income,
          occupation,
          gender,
          residencyStatus: residency,
        }),
      });

      const data = await response.json();
      if (response.ok && data.schemes) {
        setEligibleSchemes(data.schemes);
      } else {
        // Fallback filtering if backend database seed is not loaded
        const filtered = fallbackSchemes.filter((scheme) => {
          if (scheme.id === 'scheme-1') return income < 50000 && age > 18;
          if (scheme.id === 'scheme-2') return income < 800000 && occupation === 'STUDENT';
          return true;
        });
        setEligibleSchemes(filtered);
      }
    } catch (err) {
      // Offline fallback filtration
      const filtered = fallbackSchemes.filter((scheme) => {
        if (scheme.id === 'scheme-1') return income < 50000;
        if (scheme.id === 'scheme-2') return income < 800000 && occupation === 'STUDENT';
        return true;
      });
      setEligibleSchemes(filtered);
    } finally {
      setChecking(false);
      setHasChecked(true);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedScheme === id) {
      setExpandedScheme(null);
    } else {
      setExpandedScheme(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Location-Aware Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 mb-2 border border-white/20">
              <MapPin className="w-3.5 h-3.5" /> Filtered for {ward || taluka}, {district} District
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Government Schemes & Citizen Services</h1>
            <p className="text-teal-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Explore Maharashtra State & District schemes applicable to residents of <strong className="text-white font-bold">{district}</strong> (Taluka: {taluka}, Ward: {ward}).
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-white">
              <Landmark className="w-4 h-4 text-teal-300" /> {district} Collectorate Seva Kendra
            </div>
            <div className="text-teal-100 text-[11px]">📍 Collector Office Campus, {district}</div>
            <div className="text-teal-200 text-[11px] font-mono">📞 Helpline: 1800-120-8040</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Eligibility Criteria Form */}
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm h-fit">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-1.5">
            <Info className="w-5 h-5 text-primary" />
            Demographics Form
          </h3>

          <form onSubmit={handleCheckEligibility} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Your Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Annual Family Income (₹)</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Primary Profession</label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-4 py-2 rounded-md3 border border-slate-border bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="STUDENT">Student</option>
                <option value="FARMER">Farmer / Agriculturalist</option>
                <option value="UNEMPLOYED">Unemployed</option>
                <option value="SALARIED">Salaried Employee</option>
                <option value="SELF_EMPLOYED">Self Employed / Business</option>
                <option value="RETIRED">Retired / Pensioner</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 rounded-md3 border border-slate-border bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="ALL">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Residency Status</label>
              <select
                value={residency}
                onChange={(e) => setResidency(e.target.value)}
                className="w-full px-4 py-2 rounded-md3 border border-slate-border bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="MAHARASHTRA">Maharashtra Domicile</option>
                <option value="OTHER">Other State Residency</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={checking}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-md3 font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {checking ? 'Checking Schemes...' : 'Search Matching Schemes'}
            </button>
          </form>
        </div>

        {/* Right Side: Eligible Schemes Results list */}
        <div className="lg:col-span-2 space-y-4">
          {!hasChecked ? (
            <div className="bg-white p-12 text-center rounded-md3 border border-slate-border shadow-sm flex flex-col items-center justify-center space-y-4">
              <Award className="w-16 h-16 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-700 text-lg">No Search Initiated</p>
                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                  Complete the demographic form on the left to verify your eligibility criteria against social schemes.
                </p>
              </div>
            </div>
          ) : eligibleSchemes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-md3 border border-slate-border shadow-sm flex flex-col items-center justify-center space-y-4">
              <Award className="w-16 h-16 text-red-300" />
              <div>
                <p className="font-semibold text-slate-700 text-lg">No Matching Schemes Found</p>
                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                  Try adjusting your details or income settings. Ensure your residency status matches the schemes requirement guidelines.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 text-primary-dark p-4 rounded-md3 border border-green-200 text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Congratulations! We matched {eligibleSchemes.length} schemes matching your profile.
              </div>

              {eligibleSchemes.map((scheme) => (
                <div key={scheme.id} className="bg-white rounded-md3 border border-slate-border shadow-sm overflow-hidden transition-all duration-200">
                  <div
                    onClick={() => toggleExpand(scheme.id)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50"
                  >
                    <div>
                      <span className="text-xs bg-primary-light text-primary px-2.5 py-0.5 rounded font-semibold uppercase">
                        {scheme.category}
                      </span>
                      <h4 className="font-bold text-slate-800 text-lg mt-1">{scheme.title}</h4>
                    </div>
                    {expandedScheme === scheme.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>

                  {expandedScheme === scheme.id && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50">
                      <p className="text-sm text-slate-600 leading-relaxed">{scheme.description}</p>
                      
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Required Certificates
                        </h5>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                          {scheme.documentRequirements.map((doc, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {scheme.applicationUrl && (
                        <div className="pt-2">
                          <a
                            href={scheme.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md3 font-semibold text-sm shadow-sm transition-all"
                          >
                            Apply via Aaple Sarkar
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernmentPage;
