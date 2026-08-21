import React, { useState, useEffect } from 'react';
import {
  Trash2, CheckCircle, AlertTriangle, Truck, MapPin, Plus, Search,
  Shield, Recycle, Clock, RefreshCw, Sparkles
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface WasteReport {
  id: string;
  location: string;
  district: string;
  ward: string;
  wasteType: 'MUNICIPAL_GARBAGE' | 'CONSTRUCTION_DEBRIS' | 'BIOMEDICAL' | 'E_WASTE';
  reportedBy: string;
  status: 'PENDING' | 'CLEANUP_DISPATCHED' | 'CLEARED';
  assignedInspector?: string;
  createdAt: string;
}

interface FleetVehicle {
  id: string;
  vehicleNo: string;
  driverName: string;
  district: string;
  ward: string;
  vehicleType: 'HYDRAULIC_COMPACTOR' | 'TIPPER_TRUCK' | 'E_RICKSHAW';
  wasteCategory: 'WET_WASTE' | 'DRY_RECYCLABLE' | 'MIXED';
  status: 'ON_ROUTE' | 'AT_PROCESSING_PLANT' | 'IDLE';
}

export const WasteAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'BLACKSPOTS' | 'FLEET' | 'RECYCLING'>('BLACKSPOTS');
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Blackspot form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const [ward, setWard] = useState('Shivajinagar Ward 6');
  const [wasteType, setWasteType] = useState<'MUNICIPAL_GARBAGE' | 'CONSTRUCTION_DEBRIS' | 'BIOMEDICAL' | 'E_WASTE'>('MUNICIPAL_GARBAGE');
  const [inspector, setInspector] = useState('Sanitation Inspector K. Pawar');

  useEffect(() => {
    const unsubReports = onSnapshot(collection(db, 'wasteRequests'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WasteReport));
      if (list.length === 0) {
        setReports([
          { id: 'wst_1', location: 'Behind Market Yard Gate No 3', district: 'Pune', ward: 'Gultekdi Ward 18', wasteType: 'MUNICIPAL_GARBAGE', reportedBy: 'Citizen Suresh Kadam', status: 'CLEANUP_DISPATCHED', assignedInspector: 'Inspector S. Joshi', createdAt: new Date().toISOString() },
          { id: 'wst_2', location: 'Near Rankala Lake Promenade', district: 'Kolhapur', ward: 'Rankala Ward 2', wasteType: 'MUNICIPAL_GARBAGE', reportedBy: 'Tourist Forum', status: 'PENDING', assignedInspector: 'Inspector V. Shinde', createdAt: new Date().toISOString() },
          { id: 'wst_3', location: 'MIDC Ambad Ring Road Corner', district: 'Nashik', ward: 'Ambad Ward 11', wasteType: 'CONSTRUCTION_DEBRIS', reportedBy: 'Industrial Association', status: 'CLEARED', assignedInspector: 'Inspector R. More', createdAt: new Date().toISOString() },
        ]);
      } else {
        setReports(list);
      }
    });

    const unsubFleet = onSnapshot(collection(db, 'wasteFleet'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FleetVehicle));
      if (list.length === 0) {
        setFleet([
          { id: 'flt_1', vehicleNo: 'MH-12-CZ-1980', driverName: 'Santosh Gaikwad', district: 'Pune', ward: 'Kothrud', vehicleType: 'HYDRAULIC_COMPACTOR', wasteCategory: 'WET_WASTE', status: 'ON_ROUTE' },
          { id: 'flt_2', vehicleNo: 'MH-09-EM-3341', driverName: 'Tanaji Patil', district: 'Kolhapur', ward: 'Shahupuri', vehicleType: 'TIPPER_TRUCK', wasteCategory: 'DRY_RECYCLABLE', status: 'AT_PROCESSING_PLANT' },
          { id: 'flt_3', vehicleNo: 'MH-15-AB-5590', driverName: 'Ganesh Desale', district: 'Nashik', ward: 'Panchavati', vehicleType: 'E_RICKSHAW', wasteCategory: 'WET_WASTE', status: 'ON_ROUTE' },
        ]);
      } else {
        setFleet(list);
      }
    });

    return () => {
      unsubReports();
      unsubFleet();
    };
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    try {
      const id = 'wst_' + Date.now();
      const newReport: WasteReport = {
        id,
        location: location.trim(),
        district: district.trim(),
        ward: ward.trim(),
        wasteType,
        reportedBy: user?.name || 'Sanitation Cell',
        status: 'CLEANUP_DISPATCHED',
        assignedInspector: inspector.trim(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'wasteRequests', id), newReport);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'WASTE_ADMIN',
        adminRole: 'WASTE_ADMIN',
        adminField: 'WASTE',
        action: 'LOG_CLEANUP_BLACKSPOT',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Logged sanitation blackspot at ${location}, ${district}`,
      });

      setShowAddModal(false);
      setLocation('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: 'CLEANUP_DISPATCHED' | 'CLEARED') => {
    try {
      await updateDoc(doc(db, 'wasteRequests', reportId), {
        status,
        clearedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'WASTE_ADMIN',
        adminRole: 'WASTE_ADMIN',
        adminField: 'WASTE',
        action: status === 'CLEARED' ? 'RESOLVE_WASTE_BLACKSPOT' : 'DISPATCH_SWEEPERS',
        targetId: reportId,
        timestamp: new Date().toISOString(),
        details: `Updated waste cleanup ${reportId} to ${status}`,
      });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ward?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-600/30 rounded-xl border border-teal-400/40 text-teal-300">
              <Trash2 className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED SANITATION & SWM ADMIN
                </span>
                <span className="text-xs text-teal-200">Swachh Maharashtra Solid Waste Mission</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Municipal Solid Waste & Sanitation Operations
              </h1>
              <p className="text-teal-200 text-xs mt-0.5">
                Manage garbage compactor fleets, eliminate open dumping blackspots & verify source segregation.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-900/40"
          >
            <Plus className="w-4 h-4" /> Report Waste Blackspot
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-teal-400" /> Active SWM Fleet
            </div>
            <div className="text-2xl font-black text-white mt-1">{fleet.length * 14} Vehicles</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-emerald-400" /> Source Segregation Rate
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">89.6%</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Open Blackspots
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {reports.filter((r) => r.status !== 'CLEARED').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Processed Daily Waste
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-1">2,140 Tons</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'BLACKSPOTS', label: 'Dumping Blackspot Resolution', icon: Trash2 },
            { id: 'FLEET', label: 'Compactor Fleet Tracking', icon: Truck },
            { id: 'RECYCLING', label: 'Bio-CNG & Composting Centers', icon: Recycle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-teal-600 text-white border-teal-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: BLACKSPOTS */}
        {activeTab === 'BLACKSPOTS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Active Sanitation & Garbage Blackspots</h3>
                <p className="text-xs text-slate-400">Deploy sanitation squads and track photo-verified waste disposal.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spot, ward, district..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredReports.map((r) => (
                <div key={r.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {r.wasteType.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-400" /> {r.ward}, {r.district}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{r.location}</h4>
                    <p className="text-slate-400">Inspector in-charge: <strong className="text-white">{r.assignedInspector || 'Zone Squad'}</strong></p>
                    <div className="text-[10px] text-slate-500">Reported by: {r.reportedBy}</div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 shrink-0">
                    <span
                      className={`text-right font-black uppercase text-[10px] ${
                        r.status === 'CLEARED' ? 'text-emerald-400' : r.status === 'CLEANUP_DISPATCHED' ? 'text-cyan-400' : 'text-amber-400'
                      }`}
                    >
                      Status: {r.status.replace('_', ' ')}
                    </span>

                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'CLEANUP_DISPATCHED')}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs"
                      >
                        Dispatch Cleaning Squad
                      </button>
                    )}

                    {r.status === 'CLEANUP_DISPATCHED' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'CLEARED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
                      >
                        Mark Spot Cleared
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FLEET */}
        {activeTab === 'FLEET' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Hydraulic Compactor & Door-to-Door Fleet</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">Vehicle No</th>
                    <th className="p-3">Driver Name</th>
                    <th className="p-3">Ward</th>
                    <th className="p-3">Vehicle Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Telemetry Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {fleet.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-mono font-bold text-white">{f.vehicleNo}</td>
                      <td className="p-3 font-semibold text-slate-300">{f.driverName}</td>
                      <td className="p-3 text-slate-300">{f.ward}, {f.district}</td>
                      <td className="p-3 text-teal-300">{f.vehicleType.replace('_', ' ')}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          {f.wasteCategory.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-cyan-400 font-bold uppercase text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {f.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECYCLING & BIO-CNG */}
        {activeTab === 'RECYCLING' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Waste-to-Energy & Bio-Methanation Plants</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-teal-400 font-bold">Pune Bio-CNG Fuel Plant</div>
                <div className="text-2xl font-black text-white">12,500 kg / Day</div>
                <div className="text-slate-400 text-[11px]">Fueling PMPML municipal green bus fleet.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold">Organic Compost Output</div>
                <div className="text-2xl font-black text-emerald-400">85 Tons / Week</div>
                <div className="text-slate-400 text-[11px]">Distributed to local farmers under Krishi Sanjivani.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold">Plastic Pellet Recycling</div>
                <div className="text-2xl font-black text-white">94.2% Diverted</div>
                <div className="text-slate-400 text-[11px]">Used for bituminous road resurfacing.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD BLACKSPOT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Log Garbage Blackspot for Cleanup</h3>
            <form onSubmit={handleCreateReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dumping Location / Landmark</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Near Railway Underpass, Station Road"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ward / Zone</label>
                  <input
                    type="text"
                    required
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Waste Type</label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="MUNICIPAL_GARBAGE">Municipal Garbage</option>
                    <option value="CONSTRUCTION_DEBRIS">Construction Debris</option>
                    <option value="BIOMEDICAL">Biomedical Hazard</option>
                    <option value="E_WASTE">E-Waste</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Assign Sanitation Officer</label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold"
                >
                  Dispatch Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
