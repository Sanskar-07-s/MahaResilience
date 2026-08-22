import React, { useState, useEffect } from 'react';
import {
  GraduationCap, School, BookOpen, Award, CheckCircle, XCircle, Search, Plus,
  MapPin, Shield, RefreshCw, AlertCircle, ExternalLink, Trash2, Edit3, Building, FileText
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface Institution {
  id: string;
  name: string;
  category: 'SCHOOL' | 'COLLEGE' | 'LIBRARY' | 'TRAINING';
  district: string;
  taluka?: string;
  address: string;
  affiliation?: string;
  intakeCapacity?: number;
  contactEmail?: string;
  contactPhone?: string;
  isVerified?: boolean;
  status?: 'ACTIVE' | 'PENDING' | 'FLAGGED';
  updatedAt?: string;
}

interface Notice {
  id: string;
  title: string;
  category: 'ADMISSION' | 'SCHOLARSHIP' | 'EXAM' | 'CIRCULAR';
  targetAudience: string;
  deadline?: string;
  linkUrl?: string;
  publishedAt: string;
  active: boolean;
}

export const EducationAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'INSTITUTIONS' | 'NOTICES' | 'INFRA_GRIEVANCES'>('INSTITUTIONS');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // New Institution Form Modal
  const [showInstModal, setShowInstModal] = useState(false);
  const [instName, setInstName] = useState('');
  const [instCategory, setInstCategory] = useState<'SCHOOL' | 'COLLEGE' | 'LIBRARY' | 'TRAINING'>('COLLEGE');
  const [instDistrict, setInstDistrict] = useState(user?.district || 'Pune');
  const [instAddress, setInstAddress] = useState('');
  const [instAffiliation, setInstAffiliation] = useState('Savitribai Phule Pune University / MSBTE');
  const [instCapacity, setInstCapacity] = useState<number>(450);
  const [instEmail, setInstEmail] = useState('');
  const [instPhone, setInstPhone] = useState('');

  // New Notice Form Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'ADMISSION' | 'SCHOLARSHIP' | 'EXAM' | 'CIRCULAR'>('SCHOLARSHIP');
  const [noticeAudience, setNoticeAudience] = useState('Undergraduate & Diploma Students');
  const [noticeDeadline, setNoticeDeadline] = useState('2026-09-30');
  const [noticeLink, setNoticeLink] = useState('https://scholarships.gov.in');

  useEffect(() => {
    const unsubInst = onSnapshot(collection(db, 'educationInstitutes'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Institution));
      // Fallback initial demo records if collection is empty
      if (list.length === 0) {
        setInstitutions([
          { id: 'inst_1', name: 'Government College of Engineering (COEP Tech)', category: 'COLLEGE', district: 'Pune', address: 'Shivajinagar, Pune', affiliation: 'Autonomous State University', intakeCapacity: 1200, contactEmail: 'principal@coep.ac.in', isVerified: true, status: 'ACTIVE' },
          { id: 'inst_2', name: 'Zilla Parishad High School & Jr College', category: 'SCHOOL', district: 'Kolhapur', address: 'Bhavani Mandap Road, Kolhapur', affiliation: 'Maharashtra State Board', intakeCapacity: 650, contactEmail: 'zp.kolhapur@edu.mah.gov.in', isVerified: true, status: 'ACTIVE' },
          { id: 'inst_3', name: 'Dr. Babasaheb Ambedkar Central Library', category: 'LIBRARY', district: 'Nagpur', address: 'Civil Lines, Nagpur', affiliation: 'State Directorate of Libraries', intakeCapacity: 350, contactEmail: 'lib.nagpur@gov.in', isVerified: true, status: 'ACTIVE' },
          { id: 'inst_4', name: 'Government Industrial Training Institute (ITI)', category: 'TRAINING', district: 'Nashik', address: 'MIDC Satpur, Nashik', affiliation: 'DVET Maharashtra', intakeCapacity: 500, contactEmail: 'iti.nashik@dvet.gov.in', isVerified: false, status: 'PENDING' },
        ]);
      } else {
        setInstitutions(list);
      }
      setLoading(false);
    });

    const unsubNotices = onSnapshot(collection(db, 'educationNotices'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notice));
      if (list.length === 0) {
        setNotices([
          { id: 'not_1', title: 'MahaDBT Post-Matric Scholarship Scheme 2026-27 Registrations Open', category: 'SCHOLARSHIP', targetAudience: 'SC/ST/OBC/EBC College Students', deadline: '2026-10-15', linkUrl: 'https://mahadbt.maharashtra.gov.in', publishedAt: new Date().toISOString(), active: true },
          { id: 'not_2', title: 'MHT-CET Centralized Admission Process (CAP) Round 1 Schedule', category: 'ADMISSION', targetAudience: 'Engineering & Pharmacy Aspirants', deadline: '2026-09-05', linkUrl: 'https://cetcell.mahacet.org', publishedAt: new Date().toISOString(), active: true },
          { id: 'not_3', title: 'State Directorate RTE 25% Free Admission Quota Lottery Results', category: 'CIRCULAR', targetAudience: 'Primary School Applicants', deadline: '2026-08-30', linkUrl: 'https://student.maharashtra.gov.in', publishedAt: new Date().toISOString(), active: true },
        ]);
      } else {
        setNotices(list);
      }
    });

    return () => {
      unsubInst();
      unsubNotices();
    };
  }, []);

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim()) return;

    try {
      const id = 'inst_' + Date.now();
      const newInst: Institution = {
        id,
        name: instName.trim(),
        category: instCategory,
        district: instDistrict,
        address: instAddress.trim() || `${instDistrict} Educational Hub`,
        affiliation: instAffiliation,
        intakeCapacity: Number(instCapacity) || 100,
        contactEmail: instEmail.trim(),
        contactPhone: instPhone.trim(),
        isVerified: true,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'educationInstitutes', id), newInst);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'EDU_ADMIN',
        adminRole: 'EDUCATION_ADMIN',
        adminField: 'EDUCATION',
        action: 'REGISTER_INSTITUTION',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Registered ${instCategory} institution: ${instName} (${instDistrict})`,
      });

      setShowInstModal(false);
      setInstName('');
      setInstAddress('');
      setInstEmail('');
      setInstPhone('');
    } catch (err: any) {
      alert('Error registering institution: ' + err.message);
    }
  };

  const handleToggleVerify = async (inst: Institution) => {
    try {
      const updatedVerified = !inst.isVerified;
      await updateDoc(doc(db, 'educationInstitutes', inst.id), {
        isVerified: updatedVerified,
        status: updatedVerified ? 'ACTIVE' : 'FLAGGED',
        updatedAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'EDU_ADMIN',
        adminRole: 'EDUCATION_ADMIN',
        adminField: 'EDUCATION',
        action: updatedVerified ? 'VERIFY_INSTITUTION' : 'REVOKE_VERIFICATION',
        targetId: inst.id,
        timestamp: new Date().toISOString(),
        details: `Updated verification status of ${inst.name} to ${updatedVerified ? 'VERIFIED' : 'UNVERIFIED'}`,
      });
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteInstitution = async (id: string, name: string) => {
    if (!window.confirm(`Delete institution "${name}" from directory?`)) return;
    try {
      await deleteDoc(doc(db, 'educationInstitutes', id));
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'EDU_ADMIN',
        adminRole: 'EDUCATION_ADMIN',
        adminField: 'EDUCATION',
        action: 'DELETE_INSTITUTION',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Deleted educational institution ${name}`,
      });
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;

    try {
      const id = 'not_' + Date.now();
      const newNotice: Notice = {
        id,
        title: noticeTitle.trim(),
        category: noticeCategory,
        targetAudience: noticeAudience.trim(),
        deadline: noticeDeadline,
        linkUrl: noticeLink.trim(),
        publishedAt: new Date().toISOString(),
        active: true,
      };

      await setDoc(doc(db, 'educationNotices', id), newNotice);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'EDU_ADMIN',
        adminRole: 'EDUCATION_ADMIN',
        adminField: 'EDUCATION',
        action: 'PUBLISH_EDUCATION_NOTICE',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Published education notice: ${noticeTitle}`,
      });

      setShowNoticeModal(false);
      setNoticeTitle('');
    } catch (err: any) {
      alert('Error publishing notice: ' + err.message);
    }
  };

  const filteredInsts = institutions.filter((inst) => {
    const matchesSearch =
      inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.affiliation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || inst.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/40 text-indigo-300">
              <GraduationCap className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED EDUCATION ADMIN
                </span>
                <span className="text-xs text-indigo-200">Directorate of Higher & Technical Education</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Educational Institutions & Admissions Control Center
              </h1>
              <p className="text-indigo-200 text-xs mt-0.5">
                Manage schools, colleges, ITIs, public libraries, scholarship circulars & state admission boards.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInstModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/40"
            >
              <Plus className="w-4 h-4" /> Add Institution
            </button>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/40"
            >
              <FileText className="w-4 h-4" /> Issue Notice
            </button>
          </div>
        </div>

        {/* Stats Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" /> Registered Institutions
            </div>
            <div className="text-2xl font-black text-white mt-1">{institutions.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> State Verified
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {institutions.filter((i) => i.isVerified).length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-400" /> Active Circulars & Schemes
            </div>
            <div className="text-2xl font-black text-yellow-400 mt-1">{notices.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-purple-400" /> Cumulative Seat Capacity
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1">
              {institutions.reduce((sum, i) => sum + (i.intakeCapacity || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'INSTITUTIONS', label: 'Institutions Directory', icon: School },
            { id: 'NOTICES', label: 'Scholarships & Admissions Board', icon: FileText },
            { id: 'INFRA_GRIEVANCES', label: 'Facility Audits & Grants', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: INSTITUTIONS DIRECTORY */}
        {activeTab === 'INSTITUTIONS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto text-xs">
                {['ALL', 'COLLEGE', 'SCHOOL', 'LIBRARY', 'TRAINING'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      filterCategory === c ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search college, school, district..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">Institution</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Affiliation / Board</th>
                    <th className="p-3">Intake</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredInsts.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-850/50">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          {inst.name}
                          {inst.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{inst.address}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          {inst.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{inst.district}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{inst.affiliation || 'Autonomous'}</td>
                      <td className="p-3 font-mono font-bold text-indigo-300">{inst.intakeCapacity || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inst.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {inst.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVerify(inst)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px]"
                        >
                          {inst.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                          className="p-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SCHOLARSHIPS & NOTICES */}
        {activeTab === 'NOTICES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-white">Active Educational Notices & Admissions CAP Alerts</h3>
                <p className="text-xs text-slate-400">Broadcast official circulars directly to student dashboards across Maharashtra.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((n) => (
                <div key={n.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-500/20 text-purple-300 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                        {n.category}
                      </span>
                      <span className="text-[10px] text-slate-500">Deadline: {n.deadline || 'Ongoing'}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{n.title}</h4>
                    <p className="text-xs text-slate-400">Audience: {n.targetAudience}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Live on Citizen Portal
                    </span>
                    {n.linkUrl && (
                      <a
                        href={n.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1 font-bold text-xs"
                      >
                        Official Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INFRASTRUCTURE & GRANTS */}
        {activeTab === 'INFRA_GRIEVANCES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Institution Infrastructure Inspection & Grant Allocation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold">RTE 25% Fee Reimbursment</div>
                <div className="text-2xl font-black text-white">₹ 42.8 Cr</div>
                <div className="text-slate-500 text-[11px]">Direct DBT transferred to 1,280 private schools</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-purple-400 font-bold">STEM & Computer Labs Funded</div>
                <div className="text-2xl font-black text-white">340 Centers</div>
                <div className="text-slate-500 text-[11px]">Rural ZP & Ashram schools equipped</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold">Midday Meal Quality Score</div>
                <div className="text-2xl font-black text-white">96.4%</div>
                <div className="text-slate-500 text-[11px]">Verified by FSSAI & District Health Inspectors</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE INSTITUTION MODAL */}
      {showInstModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Register Educational Institution</h3>
            <form onSubmit={handleCreateInstitution} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="e.g. Government Polytechnic College"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={instCategory}
                    onChange={(e) => setInstCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="COLLEGE">College / University</option>
                    <option value="SCHOOL">School (ZP / State Board)</option>
                    <option value="LIBRARY">Public Library</option>
                    <option value="TRAINING">ITI / Vocational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={instDistrict}
                    onChange={(e) => setInstDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Address / Location</label>
                <input
                  type="text"
                  required
                  value={instAddress}
                  onChange={(e) => setInstAddress(e.target.value)}
                  placeholder="Campus road, Taluka, District"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Affiliation / Board</label>
                  <input
                    type="text"
                    value={instAffiliation}
                    onChange={(e) => setInstAffiliation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Student Intake Capacity</label>
                  <input
                    type="number"
                    value={instCapacity}
                    onChange={(e) => setInstCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)}
                    placeholder="contact@college.edu.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={instPhone}
                    onChange={(e) => setInstPhone(e.target.value)}
                    placeholder="+91 20 2550 XXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInstModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE NOTICE MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Issue Official Educational Notice</h3>
            <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Notice Headline</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. MHT CET 2026 Counseling Schedule"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="SCHOLARSHIP">Scholarship / Fee Waiver</option>
                    <option value="ADMISSION">Admission / CAP Round</option>
                    <option value="EXAM">Board / University Exam</option>
                    <option value="CIRCULAR">Government Circular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={noticeDeadline}
                    onChange={(e) => setNoticeDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Audience</label>
                <input
                  type="text"
                  value={noticeAudience}
                  onChange={(e) => setNoticeAudience(e.target.value)}
                  placeholder="e.g. 10th / 12th Passed Students"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Portal / Circular URL</label>
                <input
                  type="url"
                  value={noticeLink}
                  onChange={(e) => setNoticeLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
