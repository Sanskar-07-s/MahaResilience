import React, { useState, useEffect } from 'react';
import {
  Sprout, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Plus, Search,
  MapPin, Shield, BookOpen, Clock, RefreshCw, Trash2, Tag, Send
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface FarmerRequest {
  id: string;
  farmerName: string;
  phone: string;
  district: string;
  taluka: string;
  crop: string;
  issueDescription: string;
  status: 'PENDING' | 'RESOLVED';
  agronomistAdvice?: string;
  createdAt: string;
}

interface APMCRate {
  id: string;
  mandi: string;
  district: string;
  commodity: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalTons: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  updatedAt: string;
}

export const AgricultureAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'MANDI_RATES' | 'FARMER_REQUESTS' | 'PEST_ADVISORIES'>('MANDI_RATES');
  const [requests, setRequests] = useState<FarmerRequest[]>([]);
  const [mandiRates, setMandiRates] = useState<APMCRate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mandi Rate Modal
  const [showMandiModal, setShowMandiModal] = useState(false);
  const [commodity, setCommodity] = useState('Soybean (Yellow)');
  const [mandi, setMandi] = useState('Lasalgaon APMC');
  const [district, setDistrict] = useState(user?.district || 'Nashik');
  const [modalPrice, setModalPrice] = useState<number>(4750);
  const [minPrice, setMinPrice] = useState<number>(4400);
  const [maxPrice, setMaxPrice] = useState<number>(4950);
  const [arrivalTons, setArrivalTons] = useState<number>(350);
  const [trend, setTrend] = useState<'UP' | 'DOWN' | 'STABLE'>('UP');

  // Response Modal for Farmer Query
  const [selectedRequest, setSelectedRequest] = useState<FarmerRequest | null>(null);
  const [replyAdvice, setReplyAdvice] = useState('Spray Chlorantraniliprole 18.5% SC @ 0.4 ml/L water. Ensure proper soil moisture.');

  useEffect(() => {
    const unsubReq = onSnapshot(collection(db, 'farmerRequests'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FarmerRequest));
      if (list.length === 0) {
        setRequests([
          { id: 'fr_1', farmerName: 'Anandrao Patil', phone: '9822998877', district: 'Kolhapur', taluka: 'Karvir', crop: 'Sugarcane (Co 86032)', issueDescription: 'White Grub infestation noticed in root zone after heavy monsoon rains.', status: 'PENDING', createdAt: new Date().toISOString() },
          { id: 'fr_2', farmerName: 'Balasaheb Shinde', phone: '9422001122', district: 'Nashik', taluka: 'Niphad', crop: 'Grapes (Thompson Seedless)', issueDescription: 'Downy mildew symptoms on young grape clusters.', status: 'RESOLVED', agronomistAdvice: 'Spray Metalaxyl 8% + Mancozeb 64% WP @ 2.5 g/L. Maintain canopy aeration.', createdAt: new Date().toISOString() },
          { id: 'fr_3', farmerName: 'Vishnu Deshmukh', phone: '9766554433', district: 'Latur', taluka: 'Ausa', crop: 'Soybean (JS 335)', issueDescription: 'Girdle beetle and stem fly damage on 35-day crop.', status: 'PENDING', createdAt: new Date().toISOString() },
        ]);
      } else {
        setRequests(list);
      }
    });

    const unsubRates = onSnapshot(collection(db, 'apmcRates'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as APMCRate));
      if (list.length === 0) {
        setMandiRates([
          { id: 'rt_1', mandi: 'Gultekdi APMC Market Yard', district: 'Pune', commodity: 'Onion (Red Nashik)', variety: 'Medium', minPrice: 1800, maxPrice: 2600, modalPrice: 2250, arrivalTons: 620, trend: 'UP', updatedAt: new Date().toISOString() },
          { id: 'rt_2', mandi: 'Latur APMC Mandi', district: 'Latur', commodity: 'Soybean (Yellow)', variety: 'FAQ Quality', minPrice: 4350, maxPrice: 4850, modalPrice: 4650, arrivalTons: 1100, trend: 'STABLE', updatedAt: new Date().toISOString() },
          { id: 'rt_3', mandi: 'Kolhapur Shahu Market Yard', district: 'Kolhapur', commodity: 'Jaggery (Gur Box)', variety: 'No. 1 Organic', minPrice: 3800, maxPrice: 4400, modalPrice: 4150, arrivalTons: 380, trend: 'UP', updatedAt: new Date().toISOString() },
          { id: 'rt_4', mandi: 'Akola Cotton APMC', district: 'Akola', commodity: 'Cotton (Kapás)', variety: 'Medium Staple', minPrice: 6900, maxPrice: 7550, modalPrice: 7250, arrivalTons: 850, trend: 'DOWN', updatedAt: new Date().toISOString() },
        ]);
      } else {
        setMandiRates(list);
      }
    });

    return () => {
      unsubReq();
      unsubRates();
    };
  }, []);

  const handleCreateMandiRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commodity.trim() || !mandi.trim()) return;

    try {
      const id = 'rt_' + Date.now();
      const newRate: APMCRate = {
        id,
        mandi: mandi.trim(),
        district: district.trim(),
        commodity: commodity.trim(),
        variety: 'FAQ Regular',
        minPrice: Number(minPrice),
        maxPrice: Number(maxPrice),
        modalPrice: Number(modalPrice),
        arrivalTons: Number(arrivalTons),
        trend,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'apmcRates', id), newRate);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'AGRI_ADMIN',
        adminRole: 'AGRICULTURE_ADMIN',
        adminField: 'AGRICULTURE',
        action: 'UPDATE_APMC_RATE',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Published APMC price: ${commodity} at ${mandi} = ₹${modalPrice}/Qtl`,
      });

      setShowMandiModal(false);
    } catch (err: any) {
      alert('Error updating rate: ' + err.message);
    }
  };

  const handleResolveFarmerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      await updateDoc(doc(db, 'farmerRequests', selectedRequest.id), {
        status: 'RESOLVED',
        agronomistAdvice: replyAdvice.trim(),
        resolvedAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'AGRI_ADMIN',
        adminRole: 'AGRICULTURE_ADMIN',
        adminField: 'AGRICULTURE',
        action: 'RESOLVE_FARMER_ADVISORY',
        targetId: selectedRequest.id,
        timestamp: new Date().toISOString(),
        details: `Sent agronomy pest solution to farmer ${selectedRequest.farmerName}`,
      });

      setSelectedRequest(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const filteredRates = mandiRates.filter(
    (r) =>
      r.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mandi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-950 via-emerald-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-green-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600/30 rounded-xl border border-green-400/40 text-green-300">
              <Sprout className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-green-500/20 text-green-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED AGRICULTURE ADMIN
                </span>
                <span className="text-xs text-green-200">Maharashtra State Agricultural Marketing Board (MSAMB)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                APMC Mandi Rates & Agronomist Support Operations
              </h1>
              <p className="text-green-200 text-xs mt-0.5">
                Publish daily mandi modal prices, answer farmer crop pest queries & verify MSP crop arrivals.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowMandiModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-900/40"
          >
            <Plus className="w-4 h-4" /> Publish APMC Mandi Rate
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-green-400" /> Monitored APMC Mandis
            </div>
            <div className="text-2xl font-black text-white mt-1">{mandiRates.length * 36} Markets</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Farmer Queries
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {requests.filter((r) => r.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Pest Advisories Issued
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">1,420</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-300" /> Mandi Daily Arrivals
            </div>
            <div className="text-2xl font-black text-green-300 mt-1">
              {mandiRates.reduce((sum, r) => sum + (r.arrivalTons || 0), 0).toLocaleString()} MT
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'MANDI_RATES', label: 'Daily APMC Mandi Rates', icon: TrendingUp },
            { id: 'FARMER_REQUESTS', label: 'Agronomist Advisory Desk', icon: Sprout },
            { id: 'PEST_ADVISORIES', label: 'CIBRC Pest & Disease Protocols', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MANDI RATES */}
        {activeTab === 'MANDI_RATES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Daily Agricultural Produce Market Rates (₹ / Quintal)</h3>
                <p className="text-xs text-slate-400">Live commodity prices synchronized directly with MSAMB mandi yards.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search crop, mandi, district..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">Commodity & Variety</th>
                    <th className="p-3">APMC Mandi</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Min Price</th>
                    <th className="p-3">Max Price</th>
                    <th className="p-3">Modal Price (₹/Qtl)</th>
                    <th className="p-3">Daily Arrivals</th>
                    <th className="p-3">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredRates.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850/50">
                      <td className="p-3">
                        <div className="font-bold text-white">{r.commodity}</div>
                        <div className="text-[10px] text-slate-400">{r.variety}</div>
                      </td>
                      <td className="p-3 text-slate-300 font-semibold">{r.mandi}</td>
                      <td className="p-3 text-slate-400">{r.district}</td>
                      <td className="p-3 font-mono text-slate-300">₹ {r.minPrice}</td>
                      <td className="p-3 font-mono text-slate-300">₹ {r.maxPrice}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400 text-sm">₹ {r.modalPrice}</td>
                      <td className="p-3 font-mono text-slate-300">{r.arrivalTons} MT</td>
                      <td className="p-3">
                        {r.trend === 'UP' && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Rising
                          </span>
                        )}
                        {r.trend === 'DOWN' && (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5" /> Falling
                          </span>
                        )}
                        {r.trend === 'STABLE' && <span className="text-slate-400 font-bold">Stable</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FARMER REQUESTS */}
        {activeTab === 'FARMER_REQUESTS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Farmer Pest & Disease Advisory Helpline Queue</h3>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                        Crop: {req.crop}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" /> {req.taluka}, {req.district}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm">
                      {req.farmerName} (<span className="text-emerald-400 font-mono">{req.phone}</span>)
                    </h4>
                    <p className="text-slate-300">{req.issueDescription}</p>

                    {req.agronomistAdvice && (
                      <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                        <div className="text-[10px] uppercase font-black text-emerald-400">Agronomist Recommendation:</div>
                        <div>{req.agronomistAdvice}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-2 shrink-0">
                    <span
                      className={`text-right font-black uppercase text-[10px] ${
                        req.status === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      Status: {req.status}
                    </span>

                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Send Agronomist Advice
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PEST ADVISORIES */}
        {activeTab === 'PEST_ADVISORIES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">CIBRC-Approved Pest Control Advisory Guidelines</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold text-sm">Soybean: Stem Fly & Girdle Beetle</div>
                <div className="text-slate-300">
                  Chlorantraniliprole 18.5% SC @ 0.3 ml/L or Thiamethoxam 12.6% + Lambda Cyhalothrin 9.5% ZC @ 0.25 ml/L.
                </div>
                <div className="text-[10px] text-slate-500">Apply within 30-35 days of sowing.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold text-sm">Cotton: Pink Bollworm (PBW) Management</div>
                <div className="text-slate-300">
                  Install Pheromone Traps @ 5/acre. Spray Emamectin Benzoate 5% SG @ 0.4 g/L or Profenofos 50% EC @ 2 ml/L at ETL (10% flared squares).
                </div>
                <div className="text-[10px] text-slate-500">Strict adherence to IPM protocols recommended.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MANDI MODAL */}
      {showMandiModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Publish APMC Mandi Commodity Rate</h3>
            <form onSubmit={handleCreateMandiRate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Commodity Name</label>
                <input
                  type="text"
                  required
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">APMC Mandi</label>
                  <input
                    type="text"
                    required
                    value={mandi}
                    onChange={(e) => setMandi(e.target.value)}
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Modal Price (₹)</label>
                  <input
                    type="number"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Daily Arrival (MT)</label>
                  <input
                    type="number"
                    value={arrivalTons}
                    onChange={(e) => setArrivalTons(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Price Trend</label>
                  <select
                    value={trend}
                    onChange={(e) => setTrend(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="UP">Rising (▲ Upward)</option>
                    <option value="DOWN">Falling (▼ Downward)</option>
                    <option value="STABLE">Stable (― Normal)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMandiModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Publish Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AGRONOMIST REPLY MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Send Agronomist Recommendation</h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-emerald-400">{selectedRequest.farmerName} • {selectedRequest.crop}</div>
              <div className="text-slate-300">{selectedRequest.issueDescription}</div>
            </div>

            <form onSubmit={handleResolveFarmerRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Scientific Agronomy Solution & Chemical/Organic Dosage</label>
                <textarea
                  rows={4}
                  required
                  value={replyAdvice}
                  onChange={(e) => setReplyAdvice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Send Advisory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
