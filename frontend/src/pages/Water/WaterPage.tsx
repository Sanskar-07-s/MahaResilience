import React, { useState, useEffect } from 'react';
import {
  Droplets, MapPin, Clock, CheckCircle2, Phone, Truck, AlertTriangle,
  Plus, Search, Filter, Shield, User, ChevronRight, X
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { db } from '../../lib/firebase.ts';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface PublicFacilityTicket {
  id: string;
  ticketNo?: string;
  applicantName: string;
  phone: string;
  district: string;
  wardOrVillage: string;
  capacityLitres: number;
  assignedTankerNo?: string;
  driverPhone?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED';
  priority: 'EMERGENCY' | 'NORMAL' | 'HIGH';
  adminRemarks?: string;
  rejectionReason?: string;
  userId?: string;
  createdAt: string;
}

export const WaterPage: React.FC = () => {
  const { ward, city, district: locDistrict, latitude, longitude } = useLocation();
  const { user } = useAuth();

  // Live Community Tickets
  const [tickets, setTickets] = useState<PublicFacilityTicket[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'MY' | 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'DELIVERED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Request Form Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [applicantPhone, setApplicantPhone] = useState(user?.phone || '');
  const [requestDistrict, setRequestDistrict] = useState(locDistrict || 'Pune');
  const [requestWard, setRequestWard] = useState(ward || city || 'Ward 12');
  const [capacityOption, setCapacityOption] = useState<number>(10000);
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successTicketNo, setSuccessTicketNo] = useState<string | null>(null);

  const schedules = [
    { zone: `${ward || city || 'Central Ward'} Morning Supply`, hours: '06:00 AM - 09:30 AM', status: 'ACTIVE', pressure: 'Normal' },
    { zone: `${ward || city || 'Central Ward'} Evening Supply`, hours: '05:30 PM - 08:00 PM', status: 'SCHEDULED', pressure: 'High' },
  ];

  const notices = [
    { id: 'w1', title: `Municipal Tanker Distribution & Drought Relief Hub — ${requestDistrict}`, status: 'Official Notice', time: 'Active', source: `${requestDistrict} Water Works` },
    { id: 'w2', title: `Drinking Water Quality Testing & Purification Testing`, status: 'Certified Safe', time: 'Today', source: 'State Water Authority' },
  ];

  // Real-time listener on community water requests
  useEffect(() => {
    const q = query(collection(db, 'waterRequests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PublicFacilityTicket[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ticketNo: data.ticketNo || `WTR-${docSnap.id.slice(-5).toUpperCase()}`,
          applicantName: data.applicantName || 'Citizen Resident',
          phone: data.phone || '',
          district: data.district || locDistrict || 'Maharashtra',
          wardOrVillage: data.wardOrVillage || data.ward || 'Local Ward',
          capacityLitres: Number(data.capacityLitres) || 10000,
          assignedTankerNo: data.assignedTankerNo,
          driverPhone: data.driverPhone,
          status: data.status || 'PENDING',
          priority: data.priority || 'NORMAL',
          adminRemarks: data.adminRemarks,
          rejectionReason: data.rejectionReason,
          userId: data.userId,
          createdAt: data.createdAt || new Date().toISOString(),
        };
      });

      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTickets(list);
    });

    return () => unsubscribe();
  }, [locDistrict]);

  const handleCreateFacilityRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantPhone.trim()) return;

    setSubmitting(true);
    setSuccessTicketNo(null);

    const generatedTicketNo = `WTR-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await addDoc(collection(db, 'waterRequests'), {
        ticketNo: generatedTicketNo,
        applicantName: applicantName.trim(),
        phone: applicantPhone.trim(),
        district: requestDistrict,
        wardOrVillage: requestWard.trim(),
        capacityLitres: Number(capacityOption),
        priority,
        status: 'PENDING',
        notes: notes.trim(),
        userId: user?.uid || user?.id || 'citizen_user',
        latitude: latitude || 18.5204,
        longitude: longitude || 73.8567,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSuccessTicketNo(generatedTicketNo);
      setNotes('');
    } catch (err: any) {
      alert('Error submitting facility request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.ticketNo && t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.wardOrVillage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.district.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'ALL') return true;
    if (filterTab === 'MY') return t.userId === user?.uid || t.userId === user?.id;
    return t.status === filterTab;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-cyan-600 to-blue-800 text-white p-6 md:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
            <MapPin className="w-3.5 h-3.5" /> Civic Water Utilities • {requestDistrict}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Municipal Water Utilities & Public Tanker Booking
          </h1>
          <p className="text-cyan-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Request municipal drinking water tankers, monitor pipeline timetables, and track the live administrative review status of all citizen requests transparently.
          </p>
        </div>

        <button
          onClick={() => {
            setSuccessTicketNo(null);
            setShowRequestModal(true);
          }}
          className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Request Water Tanker
        </button>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 font-bold">Total Community Requests</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{tickets.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-amber-500 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {tickets.filter((t) => t.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-cyan-600 font-bold flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Approved / Dispatched
          </div>
          <div className="text-2xl font-black text-cyan-700 mt-1">
            {tickets.filter((t) => t.status === 'ACCEPTED' || t.status === 'DISPATCHED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered Successfully
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {tickets.filter((t) => t.status === 'DELIVERED').length}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Live Transparency Board; Right = Timetables & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Public Requests Transparency Board (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" /> Public Facility Request & Status Board
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live real-time feed of all community facility requests and official administrative decisions.
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, ward..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-100 pb-3 text-xs">
            {[
              { id: 'ALL', label: 'All Community Tickets' },
              { id: 'MY', label: 'My Requests' },
              { id: 'PENDING', label: '⏳ Pending' },
              { id: 'ACCEPTED', label: '✅ Accepted' },
              { id: 'DISPATCHED', label: '🚚 Dispatched' },
              { id: 'DELIVERED', label: '🏁 Delivered' },
              { id: 'REJECTED', label: '❌ Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  filterTab === tab.id
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tickets List */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                No facility requests matching this filter. Click "Request Water Tanker" to submit a new requirement.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isMyTicket = ticket.userId === user?.uid || ticket.userId === user?.id;
                return (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                      isMyTicket
                        ? 'bg-sky-50/50 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-[11px]">
                          {ticket.ticketNo}
                        </span>
                        {isMyTicket && (
                          <span className="bg-blue-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">
                            Your Ticket
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            ticket.priority === 'EMERGENCY'
                              ? 'bg-red-100 text-red-700'
                              : ticket.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ticket.priority} PRIORITY
                        </span>
                      </div>

                      {/* Real-Time Status Badge */}
                      <div>
                        {ticket.status === 'PENDING' && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Under Admin Review (Pending)
                          </span>
                        )}
                        {ticket.status === 'ACCEPTED' && (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Accepted by Administrator
                          </span>
                        )}
                        {ticket.status === 'DISPATCHED' && (
                          <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 font-bold rounded-full text-[10px] flex items-center gap-1 animate-pulse">
                            <Truck className="w-3 h-3 text-cyan-600" /> Tanker Dispatched & En Route
                          </span>
                        )}
                        {ticket.status === 'DELIVERED' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered Successfully
                          </span>
                        )}
                        {ticket.status === 'REJECTED' && (
                          <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                            <X className="w-3 h-3 text-red-600" /> Request Declined
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700">
                      <div>
                        <span className="font-bold text-slate-900">{ticket.applicantName}</span>
                        <span className="text-slate-400 ml-1.5">• {(ticket.capacityLitres || 10000).toLocaleString()} Litres Water Tanker</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-600" /> {ticket.wardOrVillage}, {ticket.district}
                      </div>
                    </div>

                    {/* Official Remarks / Reason / Dispatch Details */}
                    {ticket.adminRemarks && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                        <strong className="text-sky-800 font-bold">Authority Update: </strong>
                        {ticket.adminRemarks}
                      </div>
                    )}

                    {ticket.rejectionReason && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                        <strong className="font-bold">Administrative Decline Reason: </strong>
                        {ticket.rejectionReason}
                      </div>
                    )}

                    {ticket.assignedTankerNo && (
                      <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-900 flex flex-wrap items-center gap-4">
                        <div>Vehicle: <strong className="font-mono text-slate-900">{ticket.assignedTankerNo}</strong></div>
                        <div>Driver Helpline: <strong className="font-mono text-slate-900">{ticket.driverPhone || 'Official Dispatch Desk'}</strong></div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 pt-1 text-right">
                      Submitted on {new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Tap Water Distribution Timetable & Official Helplines */}
        <div className="space-y-6">
          {/* Timetable */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Droplets className="w-5 h-5 text-sky-600" /> Tap Water Distribution Timetable
            </h3>
            <div className="space-y-3">
              {schedules.map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">{s.zone}</h4>
                    <div className="text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-sky-600" /> {s.hours}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Notices & Helpline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Department Bulletins
            </h3>
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-1 text-xs">
                  <span className="text-[10px] font-bold bg-sky-200 text-sky-800 px-2 py-0.5 rounded-lg">{n.status}</span>
                  <h4 className="font-bold text-slate-800 pt-0.5">{n.title}</h4>
                  <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                    <span>Source: {n.source}</span>
                    <span>{n.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <a
                href="tel:1916"
                className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Phone className="w-4 h-4" /> Emergency Water Helpline (Dial 1916)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* REQUEST MUNICIPAL WATER TANKER MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-sky-600" /> Request Municipal Water Facility
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your ticket will be routed to the municipal water administrator for review.
                </p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successTicketNo ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-emerald-900 text-sm">Request Submitted Successfully!</h4>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  Your official ticket has been logged with the municipal authorities.
                </p>
                <div className="p-2.5 bg-white border border-emerald-200 rounded-xl font-mono text-sm font-black text-emerald-800">
                  Ticket #{successTicketNo}
                </div>
                <p className="text-[11px] text-slate-500">
                  You and other citizens can track the real-time status of this request on the Public Transparency Board.
                </p>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  Close & View on Board →
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateFacilityRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicant Name / Housing Society</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni / Shiv Shambhu Society"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="e.g. 98220 12345"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">District</label>
                    <select
                      value={requestDistrict}
                      onChange={(e) => setRequestDistrict(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-sky-600"
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
                      value={requestWard}
                      onChange={(e) => setRequestWard(e.target.value)}
                      placeholder="e.g. Ambegaon Ward 12"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanker Capacity Needed</label>
                    <select
                      value={capacityOption}
                      onChange={(e) => setCapacityOption(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-sky-600"
                    >
                      <option value={5000}>5,000 Litres (Small Commercial/Residential)</option>
                      <option value={10000}>10,000 Litres (Standard Housing Society)</option>
                      <option value={20000}>20,000 Litres (Heavy Community / Village)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Urgency Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none focus:border-sky-600"
                  >
                    <option value="NORMAL">Normal Priority (Standard Queue)</option>
                    <option value="HIGH">High Priority (Severe Water Shortage)</option>
                    <option value="EMERGENCY">Emergency Priority (Hospital / School / Drought Crisis)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specific Location Details / Landmark</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Near Hanuman Temple, Gate No 3, building underground sump tank..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Routing Ticket...' : 'Submit Request to Administration →'}
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

export default WaterPage;
