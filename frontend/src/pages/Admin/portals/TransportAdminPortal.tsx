import React, { useState, useEffect } from 'react';
import {
  Bus, Zap, AlertTriangle, MapPin, CheckCircle, Clock, Plus, Search,
  Navigation, Trash2, Fuel, Shield, ExternalLink, RefreshCw, AlertCircle
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface EVStation {
  id: string;
  name: string;
  operator: string;
  district: string;
  locationAddress: string;
  fastChargingKw: number;
  connectors: string[];
  totalPorts: number;
  availablePorts: number;
  status: 'OPERATIONAL' | 'BUSY' | 'MAINTENANCE';
  tariffPerKwh: number;
  updatedAt?: string;
}

interface TransitAlert {
  id: string;
  routeTitle: string;
  routeType: 'MSRTC_BUS' | 'HIGHWAY' | 'METRO' | 'FERRY';
  district: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  delayMinutes: number;
  rerouteDetails?: string;
  isActive: boolean;
  timestamp: string;
}

export const TransportAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'EV_CHARGING' | 'TRANSIT_ALERTS' | 'FLEET_METRICS'>('EV_CHARGING');
  const [evStations, setEvStations] = useState<EVStation[]>([]);
  const [transitAlerts, setTransitAlerts] = useState<TransitAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // New EV Station Form Modal
  const [showEvModal, setShowEvModal] = useState(false);
  const [stationName, setStationName] = useState('');
  const [operator, setOperator] = useState('MSEDCL Green Mobility / Tata Power');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const [address, setAddress] = useState('');
  const [kwCapacity, setKwCapacity] = useState<number>(60);
  const [totalPorts, setTotalPorts] = useState<number>(4);
  const [tariff, setTariff] = useState<number>(14.5);

  // New Transit Alert Form Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [routeTitle, setRouteTitle] = useState('');
  const [routeType, setRouteType] = useState<'MSRTC_BUS' | 'HIGHWAY' | 'METRO' | 'FERRY'>('MSRTC_BUS');
  const [alertSeverity, setAlertSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('WARNING');
  const [alertDesc, setAlertDesc] = useState('');
  const [delayMinutes, setDelayMinutes] = useState<number>(25);
  const [reroutePath, setReroutePath] = useState('');

  useEffect(() => {
    const unsubEv = onSnapshot(collection(db, 'evStations'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EVStation));
      if (list.length === 0) {
        setEvStations([
          { id: 'ev_1', name: 'MSEDCL Fast Charging Hub - Expressway Plaza', operator: 'MSEDCL EV', district: 'Pune', locationAddress: 'Mumbai-Pune Expressway, Urse Toll', fastChargingKw: 120, connectors: ['CCS2', 'Type-2'], totalPorts: 6, availablePorts: 4, status: 'OPERATIONAL', tariffPerKwh: 15.0 },
          { id: 'ev_2', name: 'Central Bus Stand EV Station', operator: 'MSRTC E-Shivneri', district: 'Kolhapur', locationAddress: 'CBS Bus Depot, Kolhapur', fastChargingKw: 60, connectors: ['CCS2'], totalPorts: 4, availablePorts: 2, status: 'OPERATIONAL', tariffPerKwh: 13.5 },
          { id: 'ev_3', name: 'Nashik Highway Smart Grid Charger', operator: 'Tata Power EZ Charge', district: 'Nashik', locationAddress: 'Dwarka Circle, Nashik', fastChargingKw: 50, connectors: ['CCS2', 'CHAdeMO'], totalPorts: 2, availablePorts: 0, status: 'BUSY', tariffPerKwh: 16.0 },
          { id: 'ev_4', name: 'Samruddhi Mahamarg Interchange EV Hub', operator: 'MahaMetro EV', district: 'Nagpur', locationAddress: 'Nagpur Bypass Corridor', fastChargingKw: 150, connectors: ['Dual CCS2'], totalPorts: 8, availablePorts: 8, status: 'OPERATIONAL', tariffPerKwh: 14.0 },
        ]);
      } else {
        setEvStations(list);
      }
    });

    const unsubAlerts = onSnapshot(collection(db, 'transitAlerts'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TransitAlert));
      if (list.length === 0) {
        setTransitAlerts([
          { id: 'alt_1', routeTitle: 'Mumbai - Pune Expressway (Khandala Ghat)', routeType: 'HIGHWAY', district: 'Pune', severity: 'WARNING', description: 'Heavy fog and slow vehicle movement. Maintain safe distance.', delayMinutes: 20, rerouteDetails: 'Old Highway NH-48 as alternate route', isActive: true, timestamp: new Date().toISOString() },
          { id: 'alt_2', routeTitle: 'MSRTC Shivshahi Bus Service: Pune to Ratnagiri', routeType: 'MSRTC_BUS', district: 'Ratnagiri', severity: 'INFO', description: 'Additional holiday shuttle departures added via Kumbharli Ghat.', delayMinutes: 0, rerouteDetails: 'Normal schedule operating', isActive: true, timestamp: new Date().toISOString() },
        ]);
      } else {
        setTransitAlerts(list);
      }
    });

    return () => {
      unsubEv();
      unsubAlerts();
    };
  }, []);

  const handleCreateEvStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName.trim()) return;

    try {
      const id = 'ev_' + Date.now();
      const newStation: EVStation = {
        id,
        name: stationName.trim(),
        operator: operator.trim(),
        district: district.trim(),
        locationAddress: address.trim() || `${district} Transport Plaza`,
        fastChargingKw: Number(kwCapacity) || 50,
        connectors: ['CCS2', 'Type-2'],
        totalPorts: Number(totalPorts) || 2,
        availablePorts: Number(totalPorts) || 2,
        status: 'OPERATIONAL',
        tariffPerKwh: Number(tariff) || 14,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'evStations', id), newStation);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'TRANS_ADMIN',
        adminRole: 'TRANSPORT_ADMIN',
        adminField: 'TRANSPORT',
        action: 'ADD_EV_CHARGER',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Registered ${kwCapacity}kW EV Charging Station: ${stationName} in ${district}`,
      });

      setShowEvModal(false);
      setStationName('');
      setAddress('');
    } catch (err: any) {
      alert('Error saving EV station: ' + err.message);
    }
  };

  const handleToggleStatus = async (station: EVStation) => {
    const nextStatus = station.status === 'OPERATIONAL' ? 'MAINTENANCE' : 'OPERATIONAL';
    try {
      await updateDoc(doc(db, 'evStations', station.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'TRANS_ADMIN',
        adminRole: 'TRANSPORT_ADMIN',
        adminField: 'TRANSPORT',
        action: 'UPDATE_EV_STATUS',
        targetId: station.id,
        timestamp: new Date().toISOString(),
        details: `Updated ${station.name} status to ${nextStatus}`,
      });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleCreateTransitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeTitle.trim()) return;

    try {
      const id = 'alt_' + Date.now();
      const newAlert: TransitAlert = {
        id,
        routeTitle: routeTitle.trim(),
        routeType,
        district: user?.district || 'Statewide',
        severity: alertSeverity,
        description: alertDesc.trim(),
        delayMinutes: Number(delayMinutes) || 0,
        rerouteDetails: reroutePath.trim(),
        isActive: true,
        timestamp: new Date().toISOString(),
      };

      await setDoc(doc(db, 'transitAlerts', id), newAlert);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'TRANS_ADMIN',
        adminRole: 'TRANSPORT_ADMIN',
        adminField: 'TRANSPORT',
        action: 'DISPATCH_TRANSIT_ALERT',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Dispatched transit alert: ${routeTitle} (${alertSeverity})`,
      });

      setShowAlertModal(false);
      setRouteTitle('');
      setAlertDesc('');
      setReroutePath('');
    } catch (err: any) {
      alert('Error dispatching alert: ' + err.message);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transitAlerts', id));
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  const filteredStations = evStations.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.operator?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900 via-sky-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-600/30 rounded-xl border border-cyan-400/40 text-cyan-300">
              <Bus className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED TRANSPORT & MOBILITY ADMIN
                </span>
                <span className="text-xs text-cyan-200">MSRTC & Maharashtra EV Mission</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                State Transit & EV Supercharger Operations
              </h1>
              <p className="text-cyan-200 text-xs mt-0.5">
                Real-time monitor for EV charging infrastructure, MSRTC bus routes, ghat advisories & transit dispatches.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEvModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/40"
            >
              <Zap className="w-4 h-4" /> Add EV Hub
            </button>
            <button
              onClick={() => setShowAlertModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <AlertTriangle className="w-4 h-4" /> Dispatch Alert
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Active EV Stations
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{evStations.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Available Fast Ports
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {evStations.reduce((sum, s) => sum + (s.availablePorts || 0), 0)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Active Transit Alerts
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">{transitAlerts.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-sky-400" /> MSRTC Fleet Tracking
            </div>
            <div className="text-2xl font-black text-white mt-1">98.2% On-Time</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'EV_CHARGING', label: 'EV Charging Grid Manager', icon: Zap },
            { id: 'TRANSIT_ALERTS', label: 'Transit & Route Advisory Center', icon: Bus },
            { id: 'FLEET_METRICS', label: 'Expressway & Ghat Telemetry', icon: Navigation },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-cyan-600 text-slate-950 border-cyan-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: EV CHARGING GRID */}
        {activeTab === 'EV_CHARGING' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Maharashtra Fast EV Charging Corridors</h3>
                <p className="text-xs text-slate-400">Manage real-time availability, power outputs, and public charging tariffs.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hub, operator, district..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">EV Hub</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Power (kW)</th>
                    <th className="p-3">Available Ports</th>
                    <th className="p-3">Tariff / Unit</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredStations.map((station) => (
                    <tr key={station.id} className="hover:bg-slate-850/50">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          {station.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{station.locationAddress}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-300">{station.operator}</td>
                      <td className="p-3 text-slate-300">{station.district}</td>
                      <td className="p-3 font-mono font-bold text-cyan-300">{station.fastChargingKw} kW Fast DC</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">
                        {station.availablePorts} / {station.totalPorts}
                      </td>
                      <td className="p-3 font-mono text-amber-300">₹ {station.tariffPerKwh}/kWh</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            station.status === 'OPERATIONAL'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : station.status === 'BUSY'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {station.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleStatus(station)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px]"
                        >
                          {station.status === 'OPERATIONAL' ? 'Set Maintenance' : 'Set Active'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSIT ALERTS */}
        {activeTab === 'TRANSIT_ALERTS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-white">Live Transit Advisories & Route Delays</h3>
                <p className="text-xs text-slate-400">Broadcast highway warnings, road closures, and MSRTC shuttle schedules.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transitAlerts.map((alt) => (
                <div key={alt.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        alt.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}>
                        {alt.severity} • {alt.routeType}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-cyan-400" /> +{alt.delayMinutes}m delay
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{alt.routeTitle}</h4>
                    <p className="text-xs text-slate-300">{alt.description}</p>
                    {alt.rerouteDetails && (
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-cyan-200">
                        <strong>Reroute Guidance:</strong> {alt.rerouteDetails}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[10px]">Broadcast: {new Date(alt.timestamp).toLocaleTimeString()}</span>
                    <button
                      onClick={() => handleDeleteAlert(alt.id)}
                      className="text-red-400 hover:text-red-300 font-bold text-xs"
                    >
                      Dismiss Advisory
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FLEET & GHAT TELEMETRY */}
        {activeTab === 'FLEET_METRICS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Critical Ghat Sections & Highway Telemetry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-bold">Khandala & Bhor Ghat Safety Status</div>
                <div className="text-xl font-black text-emerald-400">NORMAL FLOW</div>
                <div className="text-slate-400 text-[11px]">CCTV speed monitoring active. No active landslide risk.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-sky-400 font-bold">MSRTC E-Shivai Electric Buses Active</div>
                <div className="text-xl font-black text-white">412 Units</div>
                <div className="text-slate-400 text-[11px]">Operating on Pune-Mumbai, Pune-Nashik, Kolhapur-Pune routes.</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold">Samruddhi Mahamarg Highway Patrolling</div>
                <div className="text-xl font-black text-white">24/7 Active</div>
                <div className="text-slate-400 text-[11px]">Emergency towing & air-ambulance landing strips ready.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE EV MODAL */}
      {showEvModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Register EV Fast Charging Station</h3>
            <form onSubmit={handleCreateEvStation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Station / Hub Name</label>
                <input
                  type="text"
                  required
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g. Pune Highway Rapid DC Station"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Operator / CPO</label>
                  <input
                    type="text"
                    required
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
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
                <label className="block text-slate-300 font-bold mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Near Highway Toll Plaza / Bus Depot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Power (kW)</label>
                  <input
                    type="number"
                    value={kwCapacity}
                    onChange={(e) => setKwCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Total Ports</label>
                  <input
                    type="number"
                    value={totalPorts}
                    onChange={(e) => setTotalPorts(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tariff (₹/kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tariff}
                    onChange={(e) => setTariff(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEvModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black"
                >
                  Save EV Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH ALERT MODAL */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Broadcast Transit Advisory</h3>
            <form onSubmit={handleCreateTransitAlert} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Corridor / Highway / Route Name</label>
                <input
                  type="text"
                  required
                  value={routeTitle}
                  onChange={(e) => setRouteTitle(e.target.value)}
                  placeholder="e.g. NH-48 Pune - Satara Highway"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Transit Mode</label>
                  <select
                    value={routeType}
                    onChange={(e) => setRouteType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="MSRTC_BUS">MSRTC Bus Service</option>
                    <option value="HIGHWAY">National / State Highway</option>
                    <option value="METRO">Metro Transit</option>
                    <option value="FERRY">Coastal Water Ferry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Severity</label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="WARNING">WARNING (Moderate Delay)</option>
                    <option value="CRITICAL">CRITICAL (Road Block / Reroute)</option>
                    <option value="INFO">INFO (Advisory / Extra Service)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Advisory Details / Reason</label>
                <textarea
                  required
                  rows={2}
                  value={alertDesc}
                  onChange={(e) => setAlertDesc(e.target.value)}
                  placeholder="Heavy traffic backlog due to bridge maintenance, expect delays."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Estimated Delay (Minutes)</label>
                  <input
                    type="number"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Alternate Route / Bypass</label>
                  <input
                    type="text"
                    value={reroutePath}
                    onChange={(e) => setReroutePath(e.target.value)}
                    placeholder="e.g. Divert via Saswad Bypass"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold"
                >
                  Dispatch Advisory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
