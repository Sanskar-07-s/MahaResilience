import React, { useState, useEffect } from 'react';
import {
  Droplet, Truck, CheckCircle, AlertTriangle, Clock, Plus, Search,
  MapPin, Shield, Activity, RefreshCw, Trash2, Waves
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface TankerRequest {
  id: string;
  applicantName: string;
  phone: string;
  district: string;
  wardOrVillage: string;
  capacityLitres: number;
  assignedTankerNo?: string;
  driverPhone?: string;
  status: 'PENDING' | 'DISPATCHED' | 'DELIVERED';
  priority: 'EMERGENCY' | 'NORMAL';
  createdAt: string;
}

interface ReservoirData {
  id: string;
  name: string;
  district: string;
  currentPercentage: number;
  totalCapacityTmc: number;
  currentStorageTmc: number;
  inflowCusecs: number;
  outflowCusecs: number;
  status: 'SAFE' | 'ALERT' | 'DROUGHT_WATCH';
}

export const WaterAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'TANKERS' | 'RESERVOIRS' | 'LEAKAGES'>('TANKERS');
  const [requests, setRequests] = useState<TankerRequest[]>([]);
  const [reservoirs, setReservoirs] = useState<ReservoirData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dispatch Modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [tankerNumber, setTankerNumber] = useState('MH-12-TR-8491');
  const [driverContact, setDriverContact] = useState('+91 98220 12345');

  // New Tanker Booking by Admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [citizenName, setCitizenName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const [ward, setWard] = useState('Dhayari / Ambegaon');
  const [litres, setLitres] = useState<number>(10000);

  useEffect(() => {
    const unsubReq = onSnapshot(collection(db, 'waterRequests'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TankerRequest));
      if (list.length === 0) {
        setRequests([
          { id: 'wt_1', applicantName: 'Sanjay Deshmukh (Housing Society)', phone: '9822145670', district: 'Pune', wardOrVillage: 'Wagholi Ward 4', capacityLitres: 10000, assignedTankerNo: 'MH-12-QB-4491', driverPhone: '9422019921', status: 'DISPATCHED', priority: 'NORMAL', createdAt: new Date().toISOString() },
          { id: 'wt_2', applicantName: 'Grampanchayat Shiroli', phone: '9970123411', district: 'Kolhapur', wardOrVillage: 'Shiroli MIDC Area', capacityLitres: 20000, status: 'PENDING', priority: 'EMERGENCY', createdAt: new Date().toISOString() },
          { id: 'wt_3', applicantName: 'Panchavati Slum Rehabilitation Block', phone: '9890112233', district: 'Nashik', wardOrVillage: 'Panchavati Ward 14', capacityLitres: 10000, status: 'DELIVERED', priority: 'NORMAL', createdAt: new Date().toISOString() },
        ]);
      } else {
        setRequests(list);
      }
    });

    const unsubRes = onSnapshot(collection(db, 'reservoirMetrics'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReservoirData));
      if (list.length === 0) {
        setReservoirs([
          { id: 'res_1', name: 'Khadakwasla Dam', district: 'Pune', currentPercentage: 88.4, totalCapacityTmc: 1.97, currentStorageTmc: 1.74, inflowCusecs: 1200, outflowCusecs: 850, status: 'SAFE' },
          { id: 'res_2', name: 'Koyna Dam (Shivsagar Lake)', district: 'Satara', currentPercentage: 92.1, totalCapacityTmc: 105.25, currentStorageTmc: 96.93, inflowCusecs: 4500, outflowCusecs: 2100, status: 'SAFE' },
          { id: 'res_3', name: 'Jayakwadi Dam (Nath Sagar)', district: 'Chhatrapati Sambhajinagar', currentPercentage: 64.2, totalCapacityTmc: 102.73, currentStorageTmc: 65.95, inflowCusecs: 3100, outflowCusecs: 0, status: 'SAFE' },
          { id: 'res_4', name: 'Radhanagari Dam', district: 'Kolhapur', currentPercentage: 96.8, totalCapacityTmc: 8.36, currentStorageTmc: 8.09, inflowCusecs: 1800, outflowCusecs: 1400, status: 'ALERT' },
        ]);
      } else {
        setReservoirs(list);
      }
    });

    return () => {
      unsubReq();
      unsubRes();
    };
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName.trim()) return;

    try {
      const id = 'wt_' + Date.now();
      const newReq: TankerRequest = {
        id,
        applicantName: citizenName.trim(),
        phone: phone.trim(),
        district: district.trim(),
        wardOrVillage: ward.trim(),
        capacityLitres: Number(litres) || 10000,
        status: 'PENDING',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'waterRequests', id), newReq);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'WATER_ADMIN',
        adminRole: 'WATER_ADMIN',
        adminField: 'WATER',
        action: 'BOOK_WATER_TANKER',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Booked ${litres}L tanker for ${citizenName} in ${district}`,
      });

      setShowAddModal(false);
      setCitizenName('');
      setPhone('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAssignTanker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) return;

    try {
      await updateDoc(doc(db, 'waterRequests', selectedRequestId), {
        status: 'DISPATCHED',
        assignedTankerNo: tankerNumber.trim(),
        driverPhone: driverContact.trim(),
        dispatchedAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'WATER_ADMIN',
        adminRole: 'WATER_ADMIN',
        adminField: 'WATER',
        action: 'DISPATCH_TANKER',
        targetId: selectedRequestId,
        timestamp: new Date().toISOString(),
        details: `Dispatched tanker ${tankerNumber} to request ${selectedRequestId}`,
      });

      setShowDispatchModal(false);
      setSelectedRequestId(null);
    } catch (err: any) {
      alert('Error dispatching: ' + err.message);
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      await updateDoc(doc(db, 'waterRequests', id), {
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.applicantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.wardOrVillage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-sky-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-400/40 text-blue-300">
              <Droplet className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED WATER SUPPLY ADMIN
                </span>
                <span className="text-xs text-blue-200">Water Resources Department & Municipal Supply</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Water Resources & Municipal Tanker Dispatch
              </h1>
              <p className="text-blue-200 text-xs mt-0.5">
                Monitor live dam storage percentages, dispatch drinking water tankers & track pipeline repairs.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/40"
          >
            <Plus className="w-4 h-4" /> Book Municipal Tanker
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" /> Active Tanker Dispatches
            </div>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {requests.filter((r) => r.status === 'DISPATCHED').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Tanker Requests
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {requests.filter((r) => r.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-emerald-400" /> Avg Dam Storage
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">85.4%</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-sky-300" /> Delivered Today
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {requests.filter((r) => r.status === 'DELIVERED').length * 10} kL
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'TANKERS', label: 'Tanker Dispatch & Tracking Queue', icon: Truck },
            { id: 'RESERVOIRS', label: 'State Dams & Reservoir Telemetry', icon: Waves },
            { id: 'LEAKAGES', label: 'Pipeline Bursts & Leakage Repairs', icon: Droplet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: TANKER DISPATCH QUEUE */}
        {activeTab === 'TANKERS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Drinking Water Tanker Requests</h3>
                <p className="text-xs text-slate-400">Assign municipal tanker vehicles and track deliveries to drought-prone wards.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search citizen, ward, district..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredRequests.map((r) => (
                <div key={r.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        r.priority === 'EMERGENCY' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {r.priority} • {r.capacityLitres.toLocaleString()} Litres
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-400" /> {r.wardOrVillage}, {r.district}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{r.applicantName} ({r.phone})</h4>

                    {r.assignedTankerNo && (
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-4">
                        <div>Tanker: <strong className="text-white font-mono">{r.assignedTankerNo}</strong></div>
                        <div>Driver: <strong className="text-cyan-300 font-mono">{r.driverPhone}</strong></div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-2 shrink-0">
                    <span
                      className={`text-right font-black uppercase text-[10px] ${
                        r.status === 'DELIVERED' ? 'text-emerald-400' : r.status === 'DISPATCHED' ? 'text-cyan-400' : 'text-amber-400'
                      }`}
                    >
                      Status: {r.status}
                    </span>

                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setSelectedRequestId(r.id);
                          setShowDispatchModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs"
                      >
                        Assign & Dispatch Tanker
                      </button>
                    )}

                    {r.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleMarkDelivered(r.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
                      >
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: RESERVOIRS */}
        {activeTab === 'RESERVOIRS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Major Maharashtra Dams & Water Level Telemetry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservoirs.map((dam) => (
                <div key={dam.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold text-sm">{dam.name}</h4>
                      <p className="text-xs text-slate-400">{dam.district} • Total Capacity: {dam.totalCapacityTmc} TMC</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      dam.status === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {dam.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Current Storage</span>
                      <span className="text-blue-400 font-mono font-bold">{dam.currentStorageTmc} TMC ({dam.currentPercentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${dam.currentPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-mono">
                      <span>Inflow: {dam.inflowCusecs} cusecs</span>
                      <span>Outflow: {dam.outflowCusecs} cusecs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LEAKAGES */}
        {activeTab === 'LEAKAGES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Pipeline Burst & Contamination Incident Log</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-blue-400 font-bold">Main Feeder Pipeline 1200mm (Pune)</div>
                <div className="text-emerald-400 font-black text-sm">Pressure Normal (4.2 Bar)</div>
                <div className="text-slate-400 text-[11px]">SCADA automated valve control operational.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-bold">Kolhapur Panchganga Pumping Station</div>
                <div className="text-emerald-400 font-black text-sm">Water Quality TDS 140 ppm</div>
                <div className="text-slate-400 text-[11px]">Chlorination & filtration units running 24x7.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold">Emergency Repair Crews On Call</div>
                <div className="text-white font-black text-sm">18 Teams Deployed</div>
                <div className="text-slate-400 text-[11px]">Average resolution time for pipeline bursts: 3.4 hrs.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DISPATCH TANKER MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Dispatch Water Tanker</h3>
            <form onSubmit={handleAssignTanker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tanker Registration Number</label>
                <input
                  type="text"
                  required
                  value={tankerNumber}
                  onChange={(e) => setTankerNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Driver Contact Number</label>
                <input
                  type="tel"
                  required
                  value={driverContact}
                  onChange={(e) => setDriverContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TANKER BOOKING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create Municipal Tanker Booking</h3>
            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Citizen / Society / Village Name</label>
                <input
                  type="text"
                  required
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="e.g. Anand Nagar Resident Welfare Association"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98220 XXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Ward / Street Address</label>
                <input
                  type="text"
                  required
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Water Volume Required</label>
                <select
                  value={litres}
                  onChange={(e) => setLitres(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value={5000}>5,000 Litres (Single Tanker)</option>
                  <option value={10000}>10,000 Litres (Standard Municipal)</option>
                  <option value={20000}>20,000 Litres (Heavy Commercial / Large Society)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
