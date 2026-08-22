import React, { useState, useEffect } from 'react';
import {
  Landmark, FileCheck, Users, Shield, Plus, Search, CheckCircle, XCircle,
  ExternalLink, CreditCard, Award, Trash2, Edit3, AlertCircle, RefreshCw
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface Scheme {
  id: string;
  name: string;
  department: string;
  benefitAmount: string;
  eligibility: string;
  beneficiariesCount: number;
  applicationDeadline?: string;
  officialPortalUrl?: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  category: 'WOMEN_CHILD' | 'FARMER' | 'HEALTH' | 'PENSION' | 'YOUTH';
  updatedAt?: string;
}

interface SchemeApplication {
  id: string;
  schemeId: string;
  schemeName: string;
  applicantName: string;
  applicantAadhaarLast4: string;
  district: string;
  taluka: string;
  appliedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  dbtAccountLinked: boolean;
  remarks?: string;
}

export const GovernmentAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'SCHEMES' | 'APPLICATIONS' | 'DBT_DISBURSAL'>('SCHEMES');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [applications, setApplications] = useState<SchemeApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Scheme Modal
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [schemeName, setSchemeName] = useState('');
  const [department, setDepartment] = useState('Women and Child Development Department, Maharashtra');
  const [benefit, setBenefit] = useState('₹ 1,500 / month Direct DBT');
  const [eligibility, setEligibility] = useState('Women aged 21-65 years with annual family income under ₹ 2.5 Lakh');
  const [portalUrl, setPortalUrl] = useState('https://ladakibahin.maharashtra.gov.in');
  const [category, setCategory] = useState<'WOMEN_CHILD' | 'FARMER' | 'HEALTH' | 'PENSION' | 'YOUTH'>('WOMEN_CHILD');

  useEffect(() => {
    const unsubSchemes = onSnapshot(collection(db, 'schemes'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scheme));
      if (list.length === 0) {
        setSchemes([
          { id: 'sch_1', name: 'Mukhyamantri Majhi Ladki Bahin Yojana', department: 'Women & Child Development', benefitAmount: '₹ 1,500/month', eligibility: 'Women 21-65 yrs, Income < ₹2.5L/yr', beneficiariesCount: 14500000, category: 'WOMEN_CHILD', status: 'ACTIVE', officialPortalUrl: 'https://ladakibahin.maharashtra.gov.in' },
          { id: 'sch_2', name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)', department: 'Public Health Department', benefitAmount: 'Cashless Health Cover ₹ 5 Lakh', eligibility: 'All Ration Card (Yellow/Orange/White) Holders in MH', beneficiariesCount: 18200000, category: 'HEALTH', status: 'ACTIVE', officialPortalUrl: 'https://www.jeevandayee.gov.in' },
          { id: 'sch_3', name: 'Namo Shetkari Mahasanman Nidhi Yojana', department: 'Agriculture & Cooperation', benefitAmount: '₹ 6,000/year (₹2000 per installment)', eligibility: 'Landholding Farmers registered under PM-KISAN', beneficiariesCount: 9100000, category: 'FARMER', status: 'ACTIVE', officialPortalUrl: 'https://krishi.maharashtra.gov.in' },
          { id: 'sch_4', name: 'Sanjay Gandhi Niradhar Anudan Yojana', department: 'Social Justice & Special Assistance', benefitAmount: '₹ 1,500/month Pension', eligibility: 'Elderly, Destitute, Divyang & Widows with no family support', beneficiariesCount: 3800000, category: 'PENSION', status: 'ACTIVE', officialPortalUrl: 'https://sjsa.maharashtra.gov.in' },
        ]);
      } else {
        setSchemes(list);
      }
    });

    const unsubApps = onSnapshot(collection(db, 'schemeApplications'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchemeApplication));
      if (list.length === 0) {
        setApplications([
          { id: 'app_1', schemeId: 'sch_1', schemeName: 'Mukhyamantri Majhi Ladki Bahin Yojana', applicantName: 'Sunita Ravindra Patil', applicantAadhaarLast4: '8832', district: 'Kolhapur', taluka: 'Karvir', appliedDate: '2026-08-18', status: 'PENDING', dbtAccountLinked: true },
          { id: 'app_2', schemeId: 'sch_3', schemeName: 'Namo Shetkari Mahasanman Nidhi', applicantName: 'Dnyaneshwar Vitthal Shinde', applicantAadhaarLast4: '4190', district: 'Nashik', taluka: 'Niphad', appliedDate: '2026-08-19', status: 'PENDING', dbtAccountLinked: true },
          { id: 'app_3', schemeId: 'sch_4', schemeName: 'Sanjay Gandhi Niradhar Yojana', applicantName: 'Parvatibai Shankar Gaikwad', applicantAadhaarLast4: '7721', district: 'Pune', taluka: 'Haveli', appliedDate: '2026-08-17', status: 'APPROVED', dbtAccountLinked: true },
        ]);
      } else {
        setApplications(list);
      }
    });

    return () => {
      unsubSchemes();
      unsubApps();
    };
  }, []);

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeName.trim()) return;

    try {
      const id = 'sch_' + Date.now();
      const newScheme: Scheme = {
        id,
        name: schemeName.trim(),
        department: department.trim(),
        benefitAmount: benefit.trim(),
        eligibility: eligibility.trim(),
        beneficiariesCount: 0,
        officialPortalUrl: portalUrl.trim(),
        status: 'ACTIVE',
        category,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'schemes', id), newScheme);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'GOV_ADMIN',
        adminRole: 'GOVERNMENT_ADMIN',
        adminField: 'GOVERNMENT',
        action: 'PUBLISH_GOV_SCHEME',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Published Maharashtra welfare scheme: ${schemeName}`,
      });

      setShowSchemeModal(false);
      setSchemeName('');
    } catch (err: any) {
      alert('Error creating scheme: ' + err.message);
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateDoc(doc(db, 'schemeApplications', appId), {
        status,
        verifiedBy: user?.uid || 'GOV_ADMIN',
        verifiedAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'GOV_ADMIN',
        adminRole: 'GOVERNMENT_ADMIN',
        adminField: 'GOVERNMENT',
        action: status === 'APPROVED' ? 'APPROVE_SCHEME_APP' : 'REJECT_SCHEME_APP',
        targetId: appId,
        timestamp: new Date().toISOString(),
        details: `Updated beneficiary application ${appId} to ${status}`,
      });
    } catch (err: any) {
      alert('Error updating application: ' + err.message);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 shadow-xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/30 rounded-xl border border-purple-400/40 text-purple-300">
              <Landmark className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED WELFARE SCHEMES ADMIN
                </span>
                <span className="text-xs text-purple-200">Government of Maharashtra Public Welfare</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Welfare Schemes & DBT Operations Center
              </h1>
              <p className="text-purple-200 text-xs mt-0.5">
                Manage flagship state schemes, verify citizen beneficiary applications, and audit direct DBT releases.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSchemeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/40"
          >
            <Plus className="w-4 h-4" /> Add State Scheme
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" /> Active State Schemes
            </div>
            <div className="text-2xl font-black text-purple-400 mt-1">{schemes.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> Total Beneficiaries
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {(schemes.reduce((sum, s) => sum + (s.beneficiariesCount || 0), 0) / 10000000).toFixed(1)} Cr+
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-amber-400" /> Pending Applications
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {applications.filter((a) => a.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Monthly DBT Disbursal
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹ 4,250 Cr</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'SCHEMES', label: 'Schemes Directory & Publishing', icon: Landmark },
            { id: 'APPLICATIONS', label: 'Citizen Application Verification Queue', icon: FileCheck },
            { id: 'DBT_DISBURSAL', label: 'Direct Benefit Transfer (DBT) Batches', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: SCHEMES DIRECTORY */}
        {activeTab === 'SCHEMES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto text-xs">
                {['ALL', 'WOMEN_CHILD', 'FARMER', 'HEALTH', 'PENSION', 'YOUTH'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      selectedCategory === c ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {c.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scheme name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchemes.map((s) => (
                <div key={s.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">
                        {s.category.replace('_', ' ')}
                      </span>
                      <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        {s.benefitAmount}
                      </span>
                    </div>

                    <h4 className="text-white font-extrabold text-base">{s.name}</h4>
                    <p className="text-slate-400 text-xs font-semibold">{s.department}</p>
                    <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-xs space-y-1 text-slate-300">
                      <div className="text-[10px] text-purple-400 uppercase font-black">Eligibility Criteria</div>
                      <div>{s.eligibility}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Beneficiaries: <strong className="text-white">{s.beneficiariesCount ? s.beneficiariesCount.toLocaleString() : 'Enrolling'}</strong>
                    </span>
                    {s.officialPortalUrl && (
                      <a
                        href={s.officialPortalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 text-xs"
                      >
                        Portal Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: APPLICATIONS QUEUE */}
        {activeTab === 'APPLICATIONS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Citizen Welfare Applications Pending Officer Verification</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">Applicant</th>
                    <th className="p-3">Scheme</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Aadhaar (Last 4)</th>
                    <th className="p-3">DBT Bank Seeded</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-bold text-white">{app.applicantName}</td>
                      <td className="p-3 text-purple-300 font-semibold">{app.schemeName}</td>
                      <td className="p-3 text-slate-300">{app.taluka}, {app.district}</td>
                      <td className="p-3 font-mono text-slate-400">XXXX-XXXX-{app.applicantAadhaarLast4}</td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> NPCI Linked
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        {app.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-400 rounded font-bold text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DBT DISBURSAL */}
        {activeTab === 'DBT_DISBURSAL' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Direct Benefit Transfer (DBT) Monthly Disbursal Ledger</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-purple-400 font-bold">Ladki Bahin Installment Batch #8</div>
                <div className="text-2xl font-black text-emerald-400">100% Disbursed</div>
                <div className="text-slate-400 text-[11px]">₹ 2,175 Cr credited via RBI Aadhaar Payment Bridge (APB).</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold">Namo Shetkari Q2 Installment</div>
                <div className="text-2xl font-black text-white">₹ 1,820 Cr</div>
                <div className="text-slate-400 text-[11px]">9.1 Million farmers covered across 36 districts.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold">Failed / Returned Transactions</div>
                <div className="text-2xl font-black text-amber-400">0.08%</div>
                <div className="text-slate-400 text-[11px]">Automated SMS alert sent for bank KYC re-verification.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE SCHEME MODAL */}
      {showSchemeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Add Maharashtra Welfare Scheme</h3>
            <form onSubmit={handleCreateScheme} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Scheme Title</label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  placeholder="e.g. Mukhyamantri Solar Krishi Vahini Yojana"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="WOMEN_CHILD">Women & Child</option>
                    <option value="FARMER">Farmer & Agriculture</option>
                    <option value="HEALTH">Health & Insurance</option>
                    <option value="PENSION">Social Pension & Divyang</option>
                    <option value="YOUTH">Youth & Employment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Benefit Package</label>
                  <input
                    type="text"
                    required
                    value={benefit}
                    onChange={(e) => setBenefit(e.target.value)}
                    placeholder="e.g. ₹ 2,000 / month DBT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nodal Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Eligibility Criteria</label>
                <textarea
                  required
                  rows={2}
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Official Portal URL</label>
                <input
                  type="url"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSchemeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Publish Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
