import React, { useState, useEffect } from 'react';
import {
  Landmark, FileCheck, Users, Shield, Plus, Search, CheckCircle, XCircle,
  ExternalLink, CreditCard, Award, Trash2, Edit3, AlertCircle, RefreshCw,
  MessageSquare, Clock, Send, ThumbsUp, Check, ChevronRight
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

interface SchemeProposalRequest {
  id: string;
  docId: string;
  title: string;
  citizenName: string;
  phone: string;
  category: string;
  targetBeneficiaries: string;
  benefitAmount: string;
  reasonOrNeed: string;
  district: string;
  taluka: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const GovernmentAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'SCHEMES' | 'APPLICATIONS' | 'SCHEME_REQUESTS' | 'DBT_DISBURSAL'>('SCHEMES');
  const [schemes, setSchemes] = useState<Scheme[]>([
    { id: 'sch_1', name: 'Mukhyamantri Majhi Ladki Bahin Yojana', department: 'Women & Child Development', benefitAmount: '₹ 1,500/month', eligibility: 'Women 21-65 yrs, Income < ₹2.5L/yr', beneficiariesCount: 14500000, category: 'WOMEN_CHILD', status: 'ACTIVE', officialPortalUrl: 'https://ladakibahin.maharashtra.gov.in' },
    { id: 'sch_2', name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)', department: 'Public Health Department', benefitAmount: 'Cashless Health Cover ₹ 5 Lakh', eligibility: 'All Ration Card (Yellow/Orange/White) Holders in MH', beneficiariesCount: 18200000, category: 'HEALTH', status: 'ACTIVE', officialPortalUrl: 'https://www.jeevandayee.gov.in' },
    { id: 'sch_3', name: 'Namo Shetkari Mahasanman Nidhi Yojana', department: 'Agriculture & Cooperation', benefitAmount: '₹ 6,000/year (₹2000 per installment)', eligibility: 'Landholding Farmers registered under PM-KISAN', beneficiariesCount: 9100000, category: 'FARMER', status: 'ACTIVE', officialPortalUrl: 'https://krishi.maharashtra.gov.in' },
    { id: 'sch_4', name: 'Sanjay Gandhi Niradhar Anudan Yojana', department: 'Social Justice & Special Assistance', benefitAmount: '₹ 1,500/month Pension', eligibility: 'Elderly, Destitute, Divyang & Widows with no family support', beneficiariesCount: 3800000, category: 'PENSION', status: 'ACTIVE', officialPortalUrl: 'https://sjsa.maharashtra.gov.in' },
  ]);
  const [applications, setApplications] = useState<SchemeApplication[]>([
    { id: 'app_1', schemeId: 'sch_1', schemeName: 'Mukhyamantri Majhi Ladki Bahin Yojana', applicantName: 'Sunita Ravindra Patil', applicantAadhaarLast4: '8832', district: 'Kolhapur', taluka: 'Karvir', appliedDate: '2026-08-18', status: 'PENDING', dbtAccountLinked: true },
    { id: 'app_2', schemeId: 'sch_3', schemeName: 'Namo Shetkari Mahasanman Nidhi', applicantName: 'Dnyaneshwar Vitthal Shinde', applicantAadhaarLast4: '4190', district: 'Nashik', taluka: 'Niphad', appliedDate: '2026-08-19', status: 'PENDING', dbtAccountLinked: true },
    { id: 'app_3', schemeId: 'sch_4', schemeName: 'Sanjay Gandhi Niradhar Yojana', applicantName: 'Parvatibai Shankar Gaikwad', applicantAadhaarLast4: '7721', district: 'Pune', taluka: 'Haveli', appliedDate: '2026-08-17', status: 'APPROVED', dbtAccountLinked: true },
  ]);
  const [schemeRequests, setSchemeRequests] = useState<SchemeProposalRequest[]>([
    {
      id: 'SCH-REQ-984210',
      docId: 'mock-req-1',
      title: 'Solar Water Pump Subsidy for Small & Marginal Farmers',
      citizenName: 'Kishor Dattatray Patil',
      phone: '9822019283',
      category: 'FARMER',
      targetBeneficiaries: 'Marginal landholding farmers (< 2 acres) in drought-prone talukas',
      benefitAmount: '90% capital subsidy on 5HP solar pump installation',
      reasonOrNeed: 'Frequent daytime power load shedding disrupts drip irrigation cycles and damages standing cash crops.',
      district: 'Kolhapur',
      taluka: 'Karvir',
      status: 'PENDING',
      createdAt: '2026-09-02T10:15:00.000Z',
    },
    {
      id: 'SCH-REQ-984211',
      docId: 'mock-req-2',
      title: 'Special Laptop Grant for Rural Girl College Students',
      citizenName: 'Pooja Ramesh Bhosale',
      phone: '9860124455',
      category: 'WOMEN_CHILD',
      targetBeneficiaries: 'Girls from rural families enrolled in STEM/Diploma courses',
      benefitAmount: '₹ 25,000 Direct Grant for laptop purchase',
      reasonOrNeed: 'Digital education barrier for girls whose families cannot afford PCs for coding and syllabus practicals.',
      district: 'Solapur',
      taluka: 'Pandharpur',
      status: 'PENDING',
      createdAt: '2026-09-03T14:20:00.000Z',
    }
  ]);
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

  // Operational Action State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubSchemes = onSnapshot(
      collection(db, 'schemes'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scheme));
        if (list.length > 0) {
          setSchemes(list);
        }
      },
      (err) => {
        console.warn('schemes onSnapshot error:', err.message);
      }
    );

    const unsubApps = onSnapshot(
      collection(db, 'schemeApplications'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchemeApplication));
        if (list.length > 0) {
          setApplications(list);
        }
      },
      (err) => {
        console.warn('schemeApplications onSnapshot error:', err.message);
      }
    );

    const unsubReqs = onSnapshot(
      collection(db, 'schemeRequests'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          docId: d.id,
          id: d.data().id || d.id,
          ...d.data()
        } as SchemeProposalRequest));
        if (list.length > 0) {
          setSchemeRequests(list);
        }
      },
      (err) => {
        console.warn('schemeRequests onSnapshot error:', err.message);
      }
    );

    return () => {
      unsubSchemes();
      unsubApps();
      unsubReqs();
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

  // Operational Action Handlers for Citizen Scheme Proposals
  const handleApproveAndPublishSchemeProposal = async (req: SchemeProposalRequest) => {
    setActionLoadingId(req.docId);
    try {
      const newSchemeId = 'sch_' + Date.now();
      const newSchemeDoc: Scheme = {
        id: newSchemeId,
        name: req.title,
        department: 'Public Welfare & Citizen Empowerment, Maharashtra',
        benefitAmount: req.benefitAmount || 'Direct Support / Subsidies',
        eligibility: `${req.targetBeneficiaries} | Purpose: ${req.reasonOrNeed}`,
        beneficiariesCount: 0,
        officialPortalUrl: 'https://aaplesarkar.maharashtra.gov.in',
        status: 'ACTIVE',
        category: (['WOMEN_CHILD', 'FARMER', 'HEALTH', 'PENSION', 'YOUTH'].includes(req.category) ? req.category : 'WOMEN_CHILD') as any,
        updatedAt: new Date().toISOString(),
      };

      // 1. Publish into schemes collection
      await setDoc(doc(db, 'schemes', newSchemeId), newSchemeDoc);

      // 2. Update schemeRequests document status to APPROVED
      if (req.docId && !req.docId.startsWith('mock-')) {
        await updateDoc(doc(db, 'schemeRequests', req.docId), {
          status: 'APPROVED',
          reviewedBy: user?.name || user?.email || 'GOV_ADMIN',
          reviewedAt: new Date().toISOString(),
          adminNotes: 'Approved & published to Maharashtra State Schemes Directory as an active public scheme.',
        });
      }

      // Update local state fallback
      setSchemeRequests((prev) =>
        prev.map((item) =>
          item.docId === req.docId
            ? {
                ...item,
                status: 'APPROVED',
                adminNotes: 'Approved & published to Maharashtra State Schemes Directory as an active public scheme.',
              }
            : item
        )
      );

      // 3. Log to auditLogs
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'GOV_ADMIN',
        adminRole: 'GOVERNMENT_ADMIN',
        adminField: 'GOVERNMENT',
        action: 'APPROVE_CITIZEN_SCHEME_PROPOSAL',
        targetId: req.docId,
        timestamp: new Date().toISOString(),
        details: `Approved citizen scheme proposal "${req.title}" from ${req.citizenName} (${req.district}) and published to schemes directory`,
      });

      alert(`Success! Scheme "${req.title}" has been approved and published to the active Maharashtra Welfare Schemes Directory.`);
    } catch (err: any) {
      console.error('Error approving scheme proposal:', err);
      alert('Error approving proposal: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSetUnderReviewSchemeProposal = async (req: SchemeProposalRequest) => {
    setActionLoadingId(req.docId);
    try {
      if (req.docId && !req.docId.startsWith('mock-')) {
        await updateDoc(doc(db, 'schemeRequests', req.docId), {
          status: 'UNDER_REVIEW',
          reviewedBy: user?.name || user?.email || 'GOV_ADMIN',
          reviewedAt: new Date().toISOString(),
          adminNotes: 'Proposal forwarded to Department of Planning and Finance for budgetary and feasibility study.',
        });
      }

      setSchemeRequests((prev) =>
        prev.map((item) =>
          item.docId === req.docId
            ? {
                ...item,
                status: 'UNDER_REVIEW',
                adminNotes: 'Proposal forwarded to Department of Planning and Finance for budgetary and feasibility study.',
              }
            : item
        )
      );

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'GOV_ADMIN',
        adminRole: 'GOVERNMENT_ADMIN',
        adminField: 'GOVERNMENT',
        action: 'UNDER_REVIEW_SCHEME_PROPOSAL',
        targetId: req.docId,
        timestamp: new Date().toISOString(),
        details: `Set citizen scheme proposal "${req.title}" under departmental review`,
      });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSchemeProposal = async (req: SchemeProposalRequest) => {
    const reason = window.prompt(
      'Enter reason or justification for rejecting scheme proposal:',
      'Does not meet current departmental guidelines or duplicates existing flagship state schemes.'
    );
    if (reason === null) return;

    setActionLoadingId(req.docId);
    try {
      if (req.docId && !req.docId.startsWith('mock-')) {
        await updateDoc(doc(db, 'schemeRequests', req.docId), {
          status: 'REJECTED',
          reviewedBy: user?.name || user?.email || 'GOV_ADMIN',
          reviewedAt: new Date().toISOString(),
          adminNotes: reason || 'Rejected by Public Welfare Department.',
        });
      }

      setSchemeRequests((prev) =>
        prev.map((item) =>
          item.docId === req.docId
            ? {
                ...item,
                status: 'REJECTED',
                adminNotes: reason || 'Rejected by Public Welfare Department.',
              }
            : item
        )
      );

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'GOV_ADMIN',
        adminRole: 'GOVERNMENT_ADMIN',
        adminField: 'GOVERNMENT',
        action: 'REJECT_SCHEME_PROPOSAL',
        targetId: req.docId,
        timestamp: new Date().toISOString(),
        details: `Rejected citizen scheme proposal "${req.title}". Reason: ${reason}`,
      });
    } catch (err: any) {
      alert('Error rejecting proposal: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const pendingRequestsCount = schemeRequests.filter((r) => r.status === 'PENDING').length;

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
                Welfare Schemes & Citizen Services Operations Center
              </h1>
              <p className="text-purple-200 text-xs mt-0.5">
                Manage flagship state schemes, approve citizen scheme proposals, verify beneficiary applications, and audit DBT releases.
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" /> Active Schemes
            </div>
            <div className="text-2xl font-black text-purple-400 mt-1">{schemes.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> Beneficiaries
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {(schemes.reduce((sum, s) => sum + (s.beneficiariesCount || 0), 0) / 10000000).toFixed(1)} Cr+
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-amber-400" /> Pending Apps
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {applications.filter((a) => a.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-purple-500/30 bg-purple-950/20 p-4 rounded-xl">
            <div className="text-purple-300 text-xs font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Scheme Proposals
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1 flex items-center gap-2">
              {pendingRequestsCount}
              {pendingRequestsCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 animate-pulse">
                  Action Required
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Monthly DBT
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">₹ 4,250 Cr</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs overflow-x-auto">
          {[
            { id: 'SCHEMES', label: 'Schemes Directory & Publishing', icon: Landmark },
            { id: 'SCHEME_REQUESTS', label: `Citizen Scheme Proposals (${pendingRequestsCount})`, icon: MessageSquare, badge: pendingRequestsCount },
            { id: 'APPLICATIONS', label: 'Citizen Application Verification Queue', icon: FileCheck },
            { id: 'DBT_DISBURSAL', label: 'Direct Benefit Transfer (DBT) Batches', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border whitespace-nowrap ${
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

        {/* TAB 2: CITIZEN SCHEME PROPOSALS & REQUESTS QUEUE */}
        {activeTab === 'SCHEME_REQUESTS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Citizen Scheme Proposals & Administrative Action Desk
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Citizens submit localized scheme demands and suggestions. Officers can approve them directly to publish into active state schemes, mark under review, or reject with feedback.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Total Proposals: <strong className="text-white">{schemeRequests.length}</strong></span>
              </div>
            </div>

            <div className="space-y-4">
              {schemeRequests.length === 0 ? (
                <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
                  <h4 className="text-base font-bold text-white">No Citizen Scheme Requests Pending</h4>
                  <p className="text-xs text-slate-400 mt-1">All citizen suggestions have been reviewed and processed.</p>
                </div>
              ) : (
                schemeRequests.map((req) => {
                  const isProcessing = actionLoadingId === req.docId;
                  return (
                    <div
                      key={req.docId || req.id}
                      className="bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-md"
                    >
                      {/* Card Top: Title, Badges & Metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {req.category?.replace('_', ' ') || 'GENERAL'}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 font-bold">
                              Ticket: {req.id}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-white">{req.title}</h4>
                          <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                            <span>Citizen: <strong className="text-white">{req.citizenName}</strong></span>
                            <span>Phone: <strong className="text-white font-mono">{req.phone}</strong></span>
                            <span>Location: <strong className="text-purple-300">{req.taluka}, {req.district}</strong></span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase inline-flex items-center gap-1.5 border ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : req.status === 'UNDER_REVIEW'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : req.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            {req.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                            {req.status === 'UNDER_REVIEW' && <Clock className="w-3.5 h-3.5" />}
                            {req.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                            {req.status === 'PENDING' && <AlertCircle className="w-3.5 h-3.5" />}
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Details: Beneficiaries, Benefit, Need */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Beneficiaries</span>
                          <span className="text-slate-200 font-semibold">{req.targetBeneficiaries || 'Not Specified'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposed Benefit Package</span>
                          <span className="text-emerald-400 font-bold font-mono">{req.benefitAmount || 'Financial Support'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citizen Justification / Ground Need</span>
                          <span className="text-slate-300">{req.reasonOrNeed || 'Community necessity'}</span>
                        </div>
                      </div>

                      {/* Admin Notes if available */}
                      {req.adminNotes && (
                        <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-purple-300">Department Remark: </span>
                            <span className="text-slate-300">{req.adminNotes}</span>
                            {req.reviewedBy && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Logged by: {req.reviewedBy} at {req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Operational Action Buttons */}
                      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500">
                          {req.status === 'APPROVED' ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Published into State Schemes Directory
                            </span>
                          ) : req.status === 'REJECTED' ? (
                            <span className="text-red-400 font-semibold">Proposal Closed</span>
                          ) : (
                            <span>Awaiting administrative verification and decision</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status !== 'APPROVED' && (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleApproveAndPublishSchemeProposal(req)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
                              title="Approve this proposal and instantly add it to the active Maharashtra Schemes Directory"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve & Publish as State Scheme
                            </button>
                          )}

                          {req.status === 'PENDING' && (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleSetUnderReviewSchemeProposal(req)}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-900/30"
                              title="Forward this request to the department committee for feasibility assessment"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Put Under Review
                            </button>
                          )}

                          {req.status !== 'REJECTED' && (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleRejectSchemeProposal(req)}
                              className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800/60 disabled:opacity-50 text-red-400 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                              title="Reject this scheme request with justification remarks"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: APPLICATIONS QUEUE */}
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

        {/* TAB 4: DBT DISBURSAL */}
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
