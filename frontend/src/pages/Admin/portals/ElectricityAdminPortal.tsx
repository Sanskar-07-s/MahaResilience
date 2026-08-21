import React, { useState, useEffect } from 'react';
import {
  Zap, AlertTriangle, CheckCircle, Clock, Plus, Search, Shield,
  Activity, MapPin, Radio, RefreshCw, Trash2, Cpu
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface OutageReport {
  id: string;
  feederName: string;
  substation: string;
  district: string;
  wardOrTaluka: string;
  cause: 'STORM' | 'TRANSFORMER_BURST' | 'LOAD_SHEDDING' | 'MAINTENANCE';
  affectedConsumers: number;
  status: 'ACTIVE' | 'CREW_DISPATCHED' | 'RESOLVED';
  restorationEta: string;
  reportedAt: string;
}

interface Substation {
  id: string;
  name: string;
  district: string;
  voltageKv: string;
  capacityMva: number;
  currentLoadMva: number;
  agriPowerShift: 'DAY_SHIFT (06:00 - 14:00)' | 'NIGHT_SHIFT (22:00 - 06:00)';
  status: 'OPTIMAL' | 'OVERLOADED' | 'MAINTENANCE';
}

export const ElectricityAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OUTAGES' | 'SUBSTATIONS' | 'AGRI_POWER'>('OUTAGES');
  const [outages, setOutages] = useState<OutageReport[]>([]);
  const [substations, setSubstations] = useState<Substation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Outage Modal
  const [showOutageModal, setShowOutageModal] = useState(false);
  const [feeder, setFeeder] = useState('');
  const [substationName, setSubstationName] = useState('220/33kV MIDC Substation');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const [ward, setWard] = useState('Hadapsar Industrial Zone');
  const [cause, setCause] = useState<'STORM' | 'TRANSFORMER_BURST' | 'LOAD_SHEDDING' | 'MAINTENANCE'>('TRANSFORMER_BURST');
  const [consumers, setConsumers] = useState<number>(3200);
  const [eta, setEta] = useState('2 hours (18:30 IST)');

  useEffect(() => {
    const unsubOutages = onSnapshot(collection(db, 'electricityReports'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OutageReport));
      if (list.length === 0) {
        setOutages([
          { id: 'out_1', feederName: '11kV Kothrud Express Feeder', substation: '132kV Kothrud Grid', district: 'Pune', wardOrTaluka: 'Kothrud Ward 12', cause: 'MAINTENANCE', affectedConsumers: 4200, status: 'CREW_DISPATCHED', restorationEta: '17:00 IST Today', reportedAt: new Date().toISOString() },
          { id: 'out_2', feederName: '33kV Shirol Industrial Feeder', substation: 'Jaysingpur 220kV Substation', district: 'Kolhapur', wardOrTaluka: 'Shirol MIDC', cause: 'TRANSFORMER_BURST', affectedConsumers: 1850, status: 'ACTIVE', restorationEta: '19:30 IST Today', reportedAt: new Date().toISOString() },
          { id: 'out_3', feederName: '11kV Sinnar Rural Agri Feeder', substation: 'Sinnar 66kV Substation', district: 'Nashik', wardOrTaluka: 'Sinnar Taluka', cause: 'STORM', affectedConsumers: 5100, status: 'RESOLVED', restorationEta: 'Restored at 14:15 IST', reportedAt: new Date().toISOString() },
        ]);
      } else {
        setOutages(list);
      }
    });

    const unsubSubs = onSnapshot(collection(db, 'electricitySubstations'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Substation));
      if (list.length === 0) {
        setSubstations([
          { id: 'sub_1', name: 'Pune West 400/220kV EHV Substation', district: 'Pune', voltageKv: '400/220 kV', capacityMva: 500, currentLoadMva: 380, agriPowerShift: 'DAY_SHIFT (06:00 - 14:00)', status: 'OPTIMAL' },
          { id: 'sub_2', name: 'Kolhapur MIDC Gokul Shirgaon 220kV Substation', district: 'Kolhapur', voltageKv: '220/33 kV', capacityMva: 200, currentLoadMva: 165, agriPowerShift: 'NIGHT_SHIFT (22:00 - 06:00)', status: 'OPTIMAL' },
          { id: 'sub_3', name: 'Nashik Satpur 132/33kV Substation', district: 'Nashik', voltageKv: '132/33 kV', capacityMva: 150, currentLoadMva: 142, agriPowerShift: 'DAY_SHIFT (06:00 - 14:00)', status: 'OVERLOADED' },
        ]);
      } else {
        setSubstations(list);
      }
    });

    return () => {
      unsubOutages();
      unsubSubs();
    };
  }, []);

  const handleCreateOutage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeder.trim()) return;

    try {
      const id = 'out_' + Date.now();
      const newOutage: OutageReport = {
        id,
        feederName: feeder.trim(),
        substation: substationName.trim(),
        district: district.trim(),
        wardOrTaluka: ward.trim(),
        cause,
        affectedConsumers: Number(consumers) || 500,
        status: 'ACTIVE',
        restorationEta: eta.trim(),
        reportedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'electricityReports', id), newOutage);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'ELEC_ADMIN',
        adminRole: 'ELECTRICITY_ADMIN',
        adminField: 'ELECTRICITY',
        action: 'LOG_POWER_OUTAGE',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Logged outage for ${feeder} in ${district}`,
      });

      setShowOutageModal(false);
      setFeeder('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateStatus = async (outageId: string, nextStatus: 'CREW_DISPATCHED' | 'RESOLVED') => {
    try {
      await updateDoc(doc(db, 'electricityReports', outageId), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'ELEC_ADMIN',
        adminRole: 'ELECTRICITY_ADMIN',
        adminField: 'ELECTRICITY',
        action: nextStatus === 'RESOLVED' ? 'RESOLVE_OUTAGE' : 'DISPATCH_REPAIR_CREW',
        targetId: outageId,
        timestamp: new Date().toISOString(),
        details: `Updated outage ${outageId} status to ${nextStatus}`,
      });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredOutages = outages.filter(
    (o) =>
      o.feederName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.wardOrTaluka?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-950 via-amber-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-yellow-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-600/30 rounded-xl border border-yellow-400/40 text-yellow-300">
              <Zap className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED ELECTRICITY ADMIN
                </span>
                <span className="text-xs text-yellow-200">MSEDCL Mahavitaran Grid Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                MSEDCL Electrical Grid & Outage Command Center
              </h1>
              <p className="text-yellow-200 text-xs mt-0.5">
                Monitor live feeder trippings, scheduled load shedding, agricultural 3-phase shifts & restoration ETAs.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowOutageModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-yellow-900/40"
          >
            <Plus className="w-4 h-4" /> Broadcast Outage / Tripping
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-yellow-400" /> Monitored Substations
            </div>
            <div className="text-2xl font-black text-white mt-1">{substations.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Active Grid Outages
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {outages.filter((o) => o.status !== 'RESOLVED').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> State Grid Frequency
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">49.98 Hz</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-yellow-300" /> Feeder Reliability Index
            </div>
            <div className="text-2xl font-black text-white mt-1">99.1%</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'OUTAGES', label: 'Feeder Trippings & Outage Log', icon: Zap },
            { id: 'SUBSTATIONS', label: 'Substation Telemetry & Load', icon: Cpu },
            { id: 'AGRI_POWER', label: 'Agricultural 3-Phase Power Shifts', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OUTAGES */}
        {activeTab === 'OUTAGES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Live Outage & Restoration Queue</h3>
                <p className="text-xs text-slate-400">Manage feeder breakdowns, deploy line crews, and update citizen ETAs.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search feeder, ward, district..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredOutages.map((o) => (
                <div key={o.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {o.cause.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-yellow-400" /> {o.wardOrTaluka}, {o.district}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{o.feederName} ({o.substation})</h4>
                    <p className="text-slate-300">
                      Affected Consumers: <strong className="text-white">{o.affectedConsumers.toLocaleString()} households/units</strong>
                    </p>
                    <div className="text-amber-300 font-semibold text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ETA: {o.restorationEta}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 shrink-0">
                    <span
                      className={`text-right font-black uppercase text-[10px] ${
                        o.status === 'RESOLVED' ? 'text-emerald-400' : o.status === 'CREW_DISPATCHED' ? 'text-cyan-400' : 'text-amber-400'
                      }`}
                    >
                      Status: {o.status.replace('_', ' ')}
                    </span>

                    {o.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(o.id, 'CREW_DISPATCHED')}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs"
                      >
                        Dispatch Line Crew
                      </button>
                    )}

                    {o.status === 'CREW_DISPATCHED' && (
                      <button
                        onClick={() => handleUpdateStatus(o.id, 'RESOLVED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
                      >
                        Mark Grid Restored
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SUBSTATIONS */}
        {activeTab === 'SUBSTATIONS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Substation Telemetry & Power Transformers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {substations.map((sub) => (
                <div key={sub.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{sub.name}</h4>
                      <p className="text-xs text-slate-400">{sub.district} • {sub.voltageKv}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      sub.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div>Load Capacity: <strong className="text-white">{sub.currentLoadMva} / {sub.capacityMva} MVA</strong></div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full rounded-full"
                        style={{ width: `${(sub.currentLoadMva / sub.capacityMva) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 font-mono">{sub.agriPowerShift}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AGRI POWER */}
        {activeTab === 'AGRI_POWER' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Farmer 8-Hour 3-Phase Agricultural Power Supply Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-yellow-400 font-bold text-sm">Zone A (Western Maharashtra / Khandesh)</div>
                <div className="text-xl font-black text-white">Day Shift: 06:00 AM - 02:00 PM</div>
                <div className="text-slate-400">Reliable solar feeder supply allocated to irrigation pumps in Pune, Kolhapur, Solapur, Sangli, Satara.</div>
              </div>
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-bold text-sm">Zone B (Marathwada / Vidarbha)</div>
                <div className="text-xl font-black text-white">Night Shift: 10:00 PM - 06:00 AM</div>
                <div className="text-slate-400">Rotational night irrigation window active for Aurangabad, Latur, Nanded, Nagpur, Amravati.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE OUTAGE MODAL */}
      {showOutageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Broadcast Grid Outage</h3>
            <form onSubmit={handleCreateOutage} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Feeder Name</label>
                <input
                  type="text"
                  required
                  value={feeder}
                  onChange={(e) => setFeeder(e.target.value)}
                  placeholder="e.g. 11kV Shivaji Nagar Line 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Substation</label>
                  <input
                    type="text"
                    value={substationName}
                    onChange={(e) => setSubstationName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Ward / Taluka / Area</label>
                <input
                  type="text"
                  required
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Zone, Sub-division"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cause of Interruption</label>
                  <select
                    value={cause}
                    onChange={(e) => setCause(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="TRANSFORMER_BURST">Transformer Breakdown</option>
                    <option value="STORM">Storm / Tree Fall</option>
                    <option value="LOAD_SHEDDING">Load Shedding</option>
                    <option value="MAINTENANCE">Scheduled Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Affected Consumers</label>
                  <input
                    type="number"
                    value={consumers}
                    onChange={(e) => setConsumers(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Restoration ETA</label>
                <input
                  type="text"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  placeholder="e.g. 2 hours (18:30 IST)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOutageModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl font-black"
                >
                  Broadcast Outage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
