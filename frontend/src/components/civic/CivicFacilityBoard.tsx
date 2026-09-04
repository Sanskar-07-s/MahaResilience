import React, { useState, useEffect } from 'react';
import {
  Shield, Clock, CheckCircle2, Truck, AlertTriangle, Plus, Search,
  MapPin, X, User, Filter, ChevronRight, Phone, Activity, Sparkles, RefreshCw
} from 'lucide-react';
import { db } from '../../lib/firebase.ts';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { isSuperAdmin, canAccessAdmin } from '../../utils/permissions.ts';

export type CivicModuleType =
  | 'WATER'
  | 'ELECTRICITY'
  | 'WASTE'
  | 'HEALTHCARE'
  | 'AGRICULTURE'
  | 'TRANSPORT'
  | 'GOVERNMENT'
  | 'EMERGENCY'
  | 'EDUCATION'
  | 'TOURISM'
  | 'ALL';

export interface FacilityOption {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
}

export interface FacilityTicket {
  id: string;
  ticketNo: string;
  module: CivicModuleType;
  facilityType: string;
  facilityName: string;
  applicantName: string;
  phone: string;
  district: string;
  wardOrVillage: string;
  priority: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'COMPLETED' | 'REJECTED';
  notes?: string;
  assignedUnit?: string;
  teamContact?: string;
  adminRemarks?: string;
  rejectionReason?: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

const MODULE_FACILITY_PRESETS: Record<CivicModuleType, { title: string; color: string; badge: string; options: FacilityOption[] }> = {
  WATER: {
    title: 'Municipal Water Utilities & Tankers',
    color: 'from-blue-700 via-sky-600 to-cyan-800',
    badge: '💧 Water Utilities',
    options: [
      { id: 'WT_5K', name: '5,000L Drinking Water Tanker', category: 'Emergency Tanker', description: 'Immediate drinking water supply for small residential society or school' },
      { id: 'WT_10K', name: '10,000L Standard Water Tanker', category: 'Standard Tanker', description: 'High-capacity supply for residential societies & colony sumps' },
      { id: 'WT_20K', name: '20,000L Heavy Tanker (Drought/Village)', category: 'Community Tanker', description: 'Village community storage or municipal ward booster' },
      { id: 'PIPE_REPAIR', name: 'Main Pipeline Repair Unit', category: 'Infrastructure', description: 'Urgent repair for burst water mains, heavy contamination or leaks' },
    ],
  },
  ELECTRICITY: {
    title: 'MSEDCL Power Grid & Emergency Facilities',
    color: 'from-amber-600 via-orange-600 to-slate-900',
    badge: '⚡ Power & Grid',
    options: [
      { id: 'GEN_50KVA', name: 'Emergency Mobile Diesel Generator (50 kVA)', category: 'Power Backup', description: 'Critical power backup for hospitals, dialysis centers & water pumps' },
      { id: 'TRANSFORMER_REP', name: 'Transformer Fuse & Oil Repair Crew', category: 'Maintenance', description: 'Burnt transformer or high-voltage fuse blown replacement' },
      { id: 'HAZARD_WIRE', name: 'Hazardous Broken HT Wire Response', category: 'Life Hazard', description: 'Immediate cordoning and repair of fallen live electricity wires' },
      { id: 'STREETLIGHT_GRID', name: 'Streetlight Feeder Line Restorer', category: 'Public Safety', description: 'Restoration of public street illumination in dark blackspots' },
    ],
  },
  WASTE: {
    title: 'Municipal Sanitation & Heavy Waste Clearance',
    color: 'from-emerald-700 via-teal-600 to-slate-900',
    badge: '♻️ Sanitation & Waste',
    options: [
      { id: 'COMPACTOR_TRUCK', name: 'Heavy Debris Compactor Truck', category: 'Heavy Machinery', description: 'Bulk green waste, construction debris or overflow clearance' },
      { id: 'HAZARD_EWASTE', name: 'Hazardous Chemical & E-Waste Pickup', category: 'Specialized Waste', description: 'Safe collection of batteries, medical scrap and toxic waste' },
      { id: 'DUMPING_CLEAR', name: 'Public Waterway / Nallah Dumping Cleanup', category: 'Sanitation Drive', description: 'Urgent unblocking of choking nallahs to prevent flooding' },
      { id: 'CARCASS_DISPOSAL', name: 'Emergency Animal Carcass Sanitation', category: 'Public Health', description: 'Quick removal and sanitization to prevent disease spread' },
    ],
  },
  HEALTHCARE: {
    title: 'Healthcare Services & Emergency Medical Assets',
    color: 'from-rose-700 via-red-600 to-slate-900',
    badge: '❤️ Healthcare Services',
    options: [
      { id: 'ICU_BED', name: 'Emergency ICU / Ventilator Bed Allocation', category: 'Critical Care', description: 'Direct priority booking at nearest civil or tertiary hospital' },
      { id: 'AMBULANCE_CARDIAC', name: 'Advanced Cardiac Life Support (ACLS) Ambulance', category: 'Emergency Transit', description: 'Paramedic-staffed cardiac ambulance for critical patient transfer' },
      { id: 'BLOOD_VAN', name: 'Mobile Blood Bank & Platelet Delivery Van', category: 'Blood Supply', description: 'Emergency rare blood group (O-ve, Bombay blood) dispatch' },
      { id: 'OXYGEN_CYLINDER', name: 'Portable Medical Oxygen Concentrator (10L)', category: 'Respiratory Care', description: 'Immediate doorstep home oxygen therapy for respiratory distress' },
    ],
  },
  AGRICULTURE: {
    title: 'Agriculture & APMC Mandi Field Facilities',
    color: 'from-green-700 via-emerald-600 to-slate-900',
    badge: '🌱 Agriculture & APMC',
    options: [
      { id: 'SOIL_TEST_VAN', name: 'Mobile Soil Health & Moisture Testing Lab', category: 'Agronomy Support', description: 'On-farm rapid NPK and micronutrient testing before sowing' },
      { id: 'COLD_STORAGE_SLOT', name: 'Emergency APMC Cold Storage Reservation', category: 'Post-Harvest', description: 'Prevent perishable vegetable/fruit spoilage during market glut' },
      { id: 'CROP_DISEASE_TEAM', name: 'Krishi Vigyan Kendra Disease Inspection Team', category: 'Crop Protection', description: 'Rapid field inspection for invasive pest attack (Armyworm/Blight)' },
      { id: 'MANDI_TRANSPORT', name: 'Subsidized APMC Mandi Grain Transport', category: 'Logistics', description: 'Shared municipal transport for small marginal farmers to Mandi' },
    ],
  },
  TRANSPORT: {
    title: 'Transit, Fleet Support & EV Emergency Hubs',
    color: 'from-cyan-700 via-sky-600 to-slate-900',
    badge: '🚌 Transit & Fleet',
    options: [
      { id: 'EV_FAST_VAN', name: 'Mobile EV Rapid Fast-Charging Van (60 kW)', category: 'EV Rescue', description: 'Roadside emergency top-up for stranded electric vehicles & buses' },
      { id: 'MSRTC_DIVERSION', name: 'MSRTC Emergency Bus Route Extension', category: 'Public Transit', description: 'Special bus run for stranded students, pilgrims or shift workers' },
      { id: 'ROAD_CRANE', name: 'Heavy Recovery Crane & Tree Clearing Unit', category: 'Road Clearance', description: 'Clear overturned vehicles or fallen banyan trees blocking highways' },
    ],
  },
  GOVERNMENT: {
    title: 'Welfare Schemes & Mobile Seva Kendra Units',
    color: 'from-purple-700 via-indigo-600 to-slate-900',
    badge: '🏛️ Welfare Seva',
    options: [
      { id: 'MOBILE_SEVA_VAN', name: 'Doorstep Mobile MahaSeva Kendra Van', category: 'Aadhaar / DBT', description: 'Biometric update & doorstep delivery of income/caste certificates' },
      { id: 'LADKI_BAHIN_CAMP', name: 'Majhi Ladki Bahin Scheme Doorstep Verification', category: 'Women Welfare', description: 'Special camp for e-KYC and DBT bank seeding for eligible women' },
      { id: 'PENSION_VERIFY', name: 'Senior Citizen ShravanBal Pension Biometric Unit', category: 'Senior Care', description: 'Life certificate submission at home for bedridden senior citizens' },
    ],
  },
  EMERGENCY: {
    title: 'Disaster Emergency Operations & Rapid Rescue',
    color: 'from-red-800 via-rose-700 to-slate-900',
    badge: '🚨 Disaster Response',
    options: [
      { id: 'RESCUE_BOAT', name: 'Flood Evacuation Motorboat Unit (NDRF Spec)', category: 'Flood Rescue', description: 'Inflatable rescue boat with divers for waterlogged settlements' },
      { id: 'DEWATER_PUMP_50HP', name: 'High-Discharge Flood De-Watering Pump (50 HP)', category: 'Flooding', description: 'Pumping water out of flooded residential basements & hospital wards' },
      { id: 'RATION_AIRDROP', name: 'Disaster Relief Dry Ration & Water Pack Drop', category: 'Relief Goods', description: 'Food grains, chlorine tablets and dry ration for cut-off villages' },
    ],
  },
  EDUCATION: {
    title: 'Public Education & Student Facility Services',
    color: 'from-indigo-700 via-purple-600 to-slate-900',
    badge: '📚 Education Resources',
    options: [
      { id: 'STUDY_DESK', name: 'Study Room & Library Reservation Slot', category: 'Study Centers', description: 'Quiet AC study space with Wi-Fi & UPSC/MPSC reference books' },
      { id: 'SCHOOL_BUS', name: 'Rural Route School Bus Extension', category: 'Student Transit', description: 'Request bus pickup route for remote village school students' },
      { id: 'DIGITAL_CLASS', name: 'Smart Classroom Audio-Visual Equipment', category: 'Digital Learning', description: 'Projector, interactive smart screen and solar backup setup' },
      { id: 'SCHOLARSHIP_DESK', name: 'MahaDBT Post-Matric Scholarship Helpdesk', category: 'Advisory', description: 'Document verification and grievance resolution for student stipends' },
    ],
  },
  TOURISM: {
    title: 'Tourism, Heritage & Pilgrim Amenities',
    color: 'from-amber-700 via-orange-600 to-slate-900',
    badge: '🏛️ Tourism & Heritage',
    options: [
      { id: 'HERITAGE_GUIDE', name: 'Certified Fort / Monument Guide Dispatch', category: 'Visitor Services', description: 'Government-certified multi-lingual history and nature guide' },
      { id: 'PILGRIM_FACILITY', name: 'Pilgrim Special Drinking Water & Rest Facility', category: 'Wari / Yatra', description: 'Mobile sanitation and drinking water tankers at temple routes' },
      { id: 'INFO_KIOSK', name: 'Tourism Information & E-Pass Kiosk Setup', category: 'Tourist Aid', description: 'Assistance booth for entry permits, safari bookings & homestays' },
    ],
  },
  ALL: {
    title: 'Statewide Civic Facility & Operational Asset Board',
    color: 'from-slate-800 via-slate-900 to-black',
    badge: '🏢 Master Civic Hub',
    options: [],
  },
};

interface CivicFacilityBoardProps {
  module: CivicModuleType;
  title?: string;
  subtitle?: string;
}

export const CivicFacilityBoard: React.FC<CivicFacilityBoardProps> = ({
  module,
  title,
  subtitle,
}) => {
  const { user } = useAuth();
  const { district: locDistrict, ward, city } = useLocation();

  const isMasterAdmin = isSuperAdmin(user);
  const isAdmin = canAccessAdmin(user) || isMasterAdmin;

  // Real-time Tickets
  const [tickets, setTickets] = useState<FacilityTicket[]>([]);
  const [filterTab, setFilterTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Request Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<CivicModuleType>(module === 'ALL' ? 'WATER' : module);
  const [facilityTypeId, setFacilityTypeId] = useState<string>('');
  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [district, setDistrict] = useState(locDistrict || 'Pune');
  const [wardArea, setWardArea] = useState(ward || city || 'Central Area');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successTicketNo, setSuccessTicketNo] = useState<string | null>(null);

  // Admin Decision Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingTicketId, setRejectingTicketId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchTicketId, setDispatchTicketId] = useState<string | null>(null);
  const [assignedUnit, setAssignedUnit] = useState('MH-12-EM-9921');
  const [teamContact, setTeamContact] = useState('+91 98220 54321');

  const config = MODULE_FACILITY_PRESETS[module];
  const availableOptions =
    module === 'ALL'
      ? MODULE_FACILITY_PRESETS[selectedModule].options
      : config.options;

  // Set default facility type when options change
  useEffect(() => {
    if (availableOptions.length > 0 && !facilityTypeId) {
      setFacilityTypeId(availableOptions[0].id);
    }
  }, [availableOptions, facilityTypeId]);

  // Local Persistence Helper for zero-downtime & offline resilience
  const STORAGE_KEY = 'maha_facility_tickets_cache_v2';

  const getLocalTickets = (): FacilityTicket[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalTickets = (list: FacilityTicket[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  };

  // Subscribe in real-time to Firestore facilityRequests with graceful fallback
  useEffect(() => {
    const collRef = collection(db, 'facilityRequests');
    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        const firestoreList: FacilityTicket[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ticketNo: data.ticketNo || `FAC-${d.id.slice(-6).toUpperCase()}`,
            module: (data.module || 'WATER') as CivicModuleType,
            facilityType: data.facilityType || 'GENERAL',
            facilityName: data.facilityName || 'Municipal Facility Asset',
            applicantName: data.applicantName || 'Citizen Resident',
            phone: data.phone || '',
            district: data.district || locDistrict || 'Maharashtra',
            wardOrVillage: data.wardOrVillage || data.ward || 'Area',
            priority: data.priority || 'NORMAL',
            status: data.status || 'PENDING',
            notes: data.notes || '',
            assignedUnit: data.assignedUnit,
            teamContact: data.teamContact,
            adminRemarks: data.adminRemarks,
            rejectionReason: data.rejectionReason,
            userId: data.userId,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
          };
        });

        // Merge with local storage tickets to ensure newly created offline/guest tickets are preserved
        const localList = getLocalTickets();
        const mergedMap = new Map<string, FacilityTicket>();
        [...localList, ...firestoreList].forEach((item) => {
          mergedMap.set(item.ticketNo || item.id, item);
        });

        const merged = Array.from(mergedMap.values());
        saveLocalTickets(merged);

        // Filter by module if not ALL
        const filtered = module === 'ALL' ? merged : merged.filter((t) => t.module === module);
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTickets(filtered);
      },
      (err) => {
        console.warn('[CivicFacilityBoard] Realtime listener fallback to local cache:', err?.message || err);
        const localList = getLocalTickets();
        const filtered = module === 'ALL' ? localList : localList.filter((t) => t.module === module);
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTickets(filtered);
      }
    );

    return () => unsubscribe();
  }, [module, locDistrict]);

  // Handle Citizen Submit Facility Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !phone.trim()) return;

    setSubmitting(true);
    setSuccessTicketNo(null);

    const activeModuleConfig = MODULE_FACILITY_PRESETS[selectedModule];
    const selectedOpt = activeModuleConfig.options.find((o) => o.id === facilityTypeId) || activeModuleConfig.options[0];
    const generatedTicketNo = `FAC-${selectedModule.slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: FacilityTicket = {
      id: `local_${Date.now()}`,
      ticketNo: generatedTicketNo,
      module: selectedModule,
      facilityType: selectedOpt.id,
      facilityName: selectedOpt.name,
      applicantName: applicantName.trim(),
      phone: phone.trim(),
      district,
      wardOrVillage: wardArea.trim(),
      priority,
      status: 'PENDING',
      notes: notes.trim(),
      userId: user?.uid || user?.id || 'citizen_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always update local cache immediately for instant, lag-free UI
    const currentLocals = getLocalTickets();
    const updatedLocals = [newTicket, ...currentLocals];
    saveLocalTickets(updatedLocals);

    setTickets((prev) => {
      const exists = prev.some((t) => t.ticketNo === generatedTicketNo);
      return exists ? prev : [newTicket, ...prev];
    });
    setSuccessTicketNo(generatedTicketNo);
    setNotes('');

    // Sync to Cloud Firestore in background
    try {
      const docRef = await addDoc(collection(db, 'facilityRequests'), {
        ticketNo: generatedTicketNo,
        module: selectedModule,
        facilityType: selectedOpt.id,
        facilityName: selectedOpt.name,
        applicantName: applicantName.trim(),
        phone: phone.trim(),
        district,
        wardOrVillage: wardArea.trim(),
        priority,
        status: 'PENDING',
        notes: notes.trim(),
        userId: user?.uid || user?.id || 'citizen_user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      newTicket.id = docRef.id;
    } catch (err: any) {
      console.warn('[CivicFacilityBoard] Firestore save offline or permission fallback:', err?.message || err);
      // Even if Firestore has transient permission or network issue, ticket is safely stored in local cache and visible to user!
    } finally {
      setSubmitting(false);
    }
  };

  // Administrative Action: Accept Request
  const handleAcceptRequest = async (ticketId: string) => {
    // Immediate optimistic local update
    const updateTicketState = (id: string, updates: Partial<FacilityTicket>) => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      const locals = getLocalTickets().map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveLocalTickets(locals);
    };

    updateTicketState(ticketId, {
      status: 'ACCEPTED',
      adminRemarks: `Request approved by ${user?.role || 'Administrator'}. Queued for asset mobilization.`,
      updatedAt: new Date().toISOString(),
    });

    try {
      if (!ticketId.startsWith('local_')) {
        await updateDoc(doc(db, 'facilityRequests', ticketId), {
          status: 'ACCEPTED',
          adminRemarks: `Request approved by ${user?.role || 'Administrator'}. Queued for asset mobilization.`,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn('[CivicFacilityBoard] Firestore update fallback:', err?.message || err);
    }
  };

  // Administrative Action: Keep Pending
  const handleKeepPending = async (ticketId: string) => {
    const updateTicketState = (id: string, updates: Partial<FacilityTicket>) => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      const locals = getLocalTickets().map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveLocalTickets(locals);
    };

    updateTicketState(ticketId, {
      status: 'PENDING',
      adminRemarks: 'Ticket under ongoing verification by municipal field engineers.',
      updatedAt: new Date().toISOString(),
    });

    try {
      if (!ticketId.startsWith('local_')) {
        await updateDoc(doc(db, 'facilityRequests', ticketId), {
          status: 'PENDING',
          adminRemarks: 'Ticket under ongoing verification by municipal field engineers.',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn('[CivicFacilityBoard] Firestore update fallback:', err?.message || err);
    }
  };

  // Administrative Action: Reject Request
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTicketId) return;

    const reason = rejectionReason.trim() || 'Declined by Administrator (Facility currently unavailable or covered by existing grid line).';
    const ticketId = rejectingTicketId;

    const updateTicketState = (id: string, updates: Partial<FacilityTicket>) => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      const locals = getLocalTickets().map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveLocalTickets(locals);
    };

    updateTicketState(ticketId, {
      status: 'REJECTED',
      rejectionReason: reason,
      adminRemarks: reason,
      updatedAt: new Date().toISOString(),
    });

    setShowRejectModal(false);
    setRejectingTicketId(null);
    setRejectionReason('');

    try {
      if (!ticketId.startsWith('local_')) {
        await updateDoc(doc(db, 'facilityRequests', ticketId), {
          status: 'REJECTED',
          rejectionReason: reason,
          adminRemarks: reason,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn('[CivicFacilityBoard] Firestore reject fallback:', err?.message || err);
    }
  };

  // Administrative Action: Dispatch Unit
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTicketId) return;

    const ticketId = dispatchTicketId;
    const unit = assignedUnit.trim();
    const contact = teamContact.trim();

    const updateTicketState = (id: string, updates: Partial<FacilityTicket>) => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      const locals = getLocalTickets().map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveLocalTickets(locals);
    };

    updateTicketState(ticketId, {
      status: 'DISPATCHED',
      assignedUnit: unit,
      teamContact: contact,
      adminRemarks: `Asset dispatched. Vehicle/Unit: ${unit}. Helpline: ${contact}`,
      updatedAt: new Date().toISOString(),
    });

    setShowDispatchModal(false);
    setDispatchTicketId(null);

    try {
      if (!ticketId.startsWith('local_')) {
        await updateDoc(doc(db, 'facilityRequests', ticketId), {
          status: 'DISPATCHED',
          assignedUnit: unit,
          teamContact: contact,
          adminRemarks: `Asset dispatched. Vehicle/Unit: ${unit}. Helpline: ${contact}`,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn('[CivicFacilityBoard] Firestore dispatch fallback:', err?.message || err);
    }
  };

  // Administrative Action: Mark Completed
  const handleMarkCompleted = async (ticketId: string) => {
    const updateTicketState = (id: string, updates: Partial<FacilityTicket>) => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      const locals = getLocalTickets().map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveLocalTickets(locals);
    };

    updateTicketState(ticketId, {
      status: 'COMPLETED',
      adminRemarks: 'Service delivered & verified successfully.',
      updatedAt: new Date().toISOString(),
    });

    try {
      if (!ticketId.startsWith('local_')) {
        await updateDoc(doc(db, 'facilityRequests', ticketId), {
          status: 'COMPLETED',
          adminRemarks: 'Service delivered & verified successfully.',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn('[CivicFacilityBoard] Firestore mark complete fallback:', err?.message || err);
    }
  };

  // Filter list
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.wardOrVillage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'ALL') return true;
    if (filterTab === 'MY') return t.userId === user?.uid || t.userId === user?.id;
    return t.status === filterTab;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6 font-sans">
      {/* Top Banner & Trigger Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold mb-1.5 border border-slate-200">
            {config.badge} • Real-Time Community Facility Center
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title || config.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {subtitle || 'Citizens can request specialized municipal facilities and equipment. All requests and official decisions are publicly transparent in real-time.'}
          </p>
        </div>

        <button
          onClick={() => {
            setSuccessTicketNo(null);
            setShowModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black rounded-2xl text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Request Facility / Service
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="text-slate-500 font-bold">Total Logged Tickets</div>
          <div className="text-xl font-black text-slate-800 mt-0.5">{tickets.length}</div>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
          <div className="text-amber-700 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </div>
          <div className="text-xl font-black text-amber-800 mt-0.5">
            {tickets.filter((t) => t.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200">
          <div className="text-blue-700 font-bold flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Dispatched / En Route
          </div>
          <div className="text-xl font-black text-blue-800 mt-0.5">
            {tickets.filter((t) => t.status === 'ACCEPTED' || t.status === 'DISPATCHED').length}
          </div>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
          <div className="text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved / Delivered
          </div>
          <div className="text-xl font-black text-emerald-800 mt-0.5">
            {tickets.filter((t) => t.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Live Board Controls: Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'All Community Tickets' },
            { id: 'MY', label: 'My Tickets' },
            { id: 'PENDING', label: '⏳ Pending' },
            { id: 'ACCEPTED', label: '✅ Accepted' },
            { id: 'DISPATCHED', label: '🚚 Dispatched' },
            { id: 'COMPLETED', label: '🏁 Completed' },
            { id: 'REJECTED', label: '❌ Declined' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                filterTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              <span className="ml-1 opacity-70">
                ({tab.id === 'ALL' ? tickets.length : tab.id === 'MY' ? tickets.filter((t) => t.userId === user?.uid || t.userId === user?.id).length : tickets.filter((t) => t.status === tab.id).length})
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket, ward, facility..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Live Tickets Feed */}
      <div className="space-y-3 pt-1">
        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-100 text-xs space-y-2">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">No facility tickets matching this filter.</p>
            <p className="text-[11px] text-slate-400">Click "Request Facility / Service" above to log a new municipal asset requirement.</p>
          </div>
        ) : (
          filteredTickets.map((t) => {
            const isMyTicket = t.userId === user?.uid || t.userId === user?.id;
            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border transition-all text-xs space-y-3 ${
                  isMyTicket
                    ? 'bg-sky-50/40 border-sky-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                      {t.ticketNo}
                    </span>
                    {isMyTicket && (
                      <span className="bg-blue-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                        Your Ticket
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        t.priority === 'EMERGENCY'
                          ? 'bg-red-100 text-red-700'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.priority} PRIORITY
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {MODULE_FACILITY_PRESETS[t.module]?.badge || t.module}
                    </span>
                  </div>

                  {/* Real-Time Status Badge */}
                  <div>
                    {t.status === 'PENDING' && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Under Admin Review (Pending)
                      </span>
                    )}
                    {t.status === 'ACCEPTED' && (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" /> Accepted by Administrator
                      </span>
                    )}
                    {t.status === 'DISPATCHED' && (
                      <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 font-bold rounded-full text-[10px] flex items-center gap-1 animate-pulse">
                        <Truck className="w-3 h-3 text-cyan-600" /> Asset Dispatched & En Route
                      </span>
                    )}
                    {t.status === 'COMPLETED' && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Service Delivered / Completed
                      </span>
                    )}
                    {t.status === 'REJECTED' && (
                      <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                        <X className="w-3 h-3 text-red-600" /> Request Declined
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-800">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{t.facilityName}</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Requested by <strong className="text-slate-900">{t.applicantName}</strong> ({t.phone})
                    </p>
                  </div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {t.wardOrVillage}, {t.district}
                  </div>
                </div>

                {t.notes && (
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-700 text-xs border border-slate-100">
                    <strong className="text-slate-900 font-bold">Requirement Note: </strong> {t.notes}
                  </div>
                )}

                {/* Admin Status Notes & Dispatched Asset Details */}
                {t.adminRemarks && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <strong className="font-bold">Authority Update: </strong> {t.adminRemarks}
                  </div>
                )}

                {t.rejectionReason && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                    <strong className="font-bold">Decline Reason: </strong> {t.rejectionReason}
                  </div>
                )}

                {t.assignedUnit && (
                  <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-900 flex flex-wrap items-center gap-4">
                    <div>Assigned Vehicle / Crew: <strong className="font-mono text-slate-900">{t.assignedUnit}</strong></div>
                    <div>Helpline: <strong className="font-mono text-slate-900">{t.teamContact || 'Official Dispatch Team'}</strong></div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-[10px] text-slate-400">
                    Logged on {new Date(t.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>

                  {/* Administrative Decision Controls (Visible to Authorized Admins) */}
                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(t.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => {
                              setRejectingTicketId(t.id);
                              setShowRejectModal(true);
                            }}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-xs"
                          >
                            ✕ Decline
                          </button>
                          <button
                            onClick={() => {
                              setDispatchTicketId(t.id);
                              setShowDispatchModal(true);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs"
                          >
                            🚚 Mobilize Asset
                          </button>
                        </>
                      )}

                      {t.status === 'ACCEPTED' && (
                        <>
                          <button
                            onClick={() => {
                              setDispatchTicketId(t.id);
                              setShowDispatchModal(true);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs"
                          >
                            🚚 Dispatch Asset / Crew
                          </button>
                          <button
                            onClick={() => handleKeepPending(t.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                          >
                            ⏳ Pending
                          </button>
                        </>
                      )}

                      {t.status === 'DISPATCHED' && (
                        <button
                          onClick={() => handleMarkCompleted(t.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
                        >
                          🏁 Mark Completed
                        </button>
                      )}

                      {t.status === 'REJECTED' && (
                        <button
                          onClick={() => handleKeepPending(t.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                        >
                          ↺ Re-evaluate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── MODAL: REQUEST FACILITY / SERVICE ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl animate-scaleUp text-xs max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" /> Request Municipal Facility / Asset
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct official escalation to department administrative officers.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successTicketNo ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-center my-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-emerald-900 text-base">Facility Ticket Logged!</h4>
                <p className="text-emerald-800 text-xs">
                  Your request has been routed to the department administrator.
                </p>
                <div className="p-3 bg-white border border-emerald-200 rounded-xl font-mono text-base font-black text-emerald-800">
                  Ticket #{successTicketNo}
                </div>
                <p className="text-[11px] text-slate-500">
                  This request is now visible on the live community transparency board for tracking.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  View on Live Board →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="flex-1 flex flex-col min-h-0 pt-2">
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-1">
                  {/* Department Selector (if module is ALL) */}
                {module === 'ALL' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Civic Department</label>
                    <select
                      value={selectedModule}
                      onChange={(e) => {
                        const m = e.target.value as CivicModuleType;
                        setSelectedModule(m);
                        setFacilityTypeId(MODULE_FACILITY_PRESETS[m].options[0]?.id || '');
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-blue-600"
                    >
                      <option value="WATER">💧 Municipal Water Utilities</option>
                      <option value="ELECTRICITY">⚡ MSEDCL Power & Grid</option>
                      <option value="WASTE">♻️ Sanitation & Heavy Waste</option>
                      <option value="HEALTHCARE">❤️ Healthcare & Ambulance</option>
                      <option value="AGRICULTURE">🌱 Agriculture & APMC Mandi</option>
                      <option value="TRANSPORT">🚌 Transit & EV Charging</option>
                      <option value="GOVERNMENT">🏛️ Welfare Seva Kendra</option>
                      <option value="EMERGENCY">🚨 Disaster Response Rescue</option>
                      <option value="EDUCATION">📚 Education & Study Centers</option>
                      <option value="TOURISM">🏛️ Tourism & Pilgrimage Services</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Facility / Equipment Asset</label>
                  <select
                    value={facilityTypeId}
                    onChange={(e) => setFacilityTypeId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-blue-600"
                  >
                    {availableOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} ({opt.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {availableOptions.find((o) => o.id === facilityTypeId)?.description}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicant / Society / Grampanchayat Name</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Rajesh Patil / Anand Nagar RWA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98220 12345"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">District</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-blue-600"
                    >
                      {['Pune', 'Kolhapur', 'Mumbai', 'Satara', 'Solapur', 'Sangli', 'Nashik', 'Nagpur', 'Chhatrapati Sambhajinagar'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ward / Area / Village</label>
                    <input
                      type="text"
                      required
                      value={wardArea}
                      onChange={(e) => setWardArea(e.target.value)}
                      placeholder="e.g. Ward 14, MIDC Phase 2"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Urgency Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-blue-600"
                    >
                      <option value="NORMAL">Normal Priority</option>
                      <option value="HIGH">High Priority (Urgent)</option>
                      <option value="EMERGENCY">Emergency Crisis (Immediate)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specific Location Details & Requirement</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide exact landmark, gate number or specific technical notes..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
              </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-white mt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Logging Ticket...' : 'Submit Request to Authority →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT REASON (ADMIN ONLY) ────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp text-xs">
            <h3 className="text-base font-extrabold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Decline Facility Request
            </h3>
            <p className="text-slate-500 text-xs">
              State the administrative reason for declining this request. The applicant and community will view this update on the transparency board.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Decline</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Existing power feeder functional; or alternative municipal tanker scheduled."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DISPATCH ASSET / ASSIGN CREW (ADMIN ONLY) ──────────────── */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp text-xs">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" /> Mobilize Asset & Assign Field Unit
            </h3>
            <p className="text-slate-500 text-xs">
              Assign registration or crew identifier and contact number for live public tracking.
            </p>

            <form onSubmit={handleConfirmDispatch} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle / Unit Registration Code</label>
                <input
                  type="text"
                  required
                  value={assignedUnit}
                  onChange={(e) => setAssignedUnit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Driver / Crew Lead Contact Helpline</label>
                <input
                  type="tel"
                  required
                  value={teamContact}
                  onChange={(e) => setTeamContact(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CivicFacilityBoard;
