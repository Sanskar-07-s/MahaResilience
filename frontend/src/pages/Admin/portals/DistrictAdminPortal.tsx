import React, { useState, useEffect } from 'react';
import {
  MapPin, FileSpreadsheet, AlertTriangle, CheckCircle, Clock, Shield,
  Users, Activity, Truck, HeartPulse, Zap, Radio, Search
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

export const DistrictAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const districtName = user?.district || 'Pune';
  const [complaints, setComplaints] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tankers, setTankers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'GRIEVANCES' | 'TANKERS' | 'ALERTS'>('GRIEVANCES');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubComp = onSnapshot(collection(db, 'complaints'), (snap) => {
      const distData = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c: any) => (c.district || '').toLowerCase() === districtName.toLowerCase());
      setComplaints(distData);
    });

    const unsubAlerts = onSnapshot(collection(db, 'alerts'), (snap) => {
      const distData = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a: any) => (a.district || '').toLowerCase() === districtName.toLowerCase() || (a.district || '') === 'All');
      setAlerts(distData);
    });

    const unsubTankers = onSnapshot(collection(db, 'waterRequests'), (snap) => {
      const distData = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t: any) => (t.district || '').toLowerCase() === districtName.toLowerCase());
      setTankers(distData);
    });

    return () => {
      unsubComp();
      unsubAlerts();
      unsubTankers();
    };
  }, [districtName]);

  const handleUpdateComplaint = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'complaints', id), {
        status,
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'DISTRICT_ADMIN',
        adminRole: 'DISTRICT_ADMIN',
        action: 'UPDATE_DISTRICT_COMPLAINT',
        targetId: id,
        district: districtName,
        timestamp: new Date().toISOString(),
        details: `Updated complaint ${id} to ${status} in ${districtName}`,
      });
    } catch (err: any) {
      alert('Error updating: ' + err.message);
    }
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ward?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-orange-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-600/30 rounded-xl border border-amber-400/40 text-amber-400">
              <MapPin className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  DISTRICT COLLECTORATE COMMAND CENTER
                </span>
                <span className="text-xs text-amber-200">District: {districtName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {districtName} District Unified Operations Portal
              </h1>
              <p className="text-amber-200 text-xs mt-0.5">
                Restricted operational jurisdiction for {districtName} District (Civic Grievances, Water Supply & Emergency Alerts).
              </p>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" /> District Grievances
            </div>
            <div className="text-2xl font-black text-white mt-1">{complaints.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" /> Water Tankers
            </div>
            <div className="text-2xl font-black text-blue-400 mt-1">{tankers.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400" /> Active Local Alerts
            </div>
            <div className="text-2xl font-black text-red-400 mt-1">{alerts.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Resolved Cases
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'GRIEVANCES', label: `District Grievances (${complaints.length})`, icon: FileSpreadsheet },
            { id: 'TANKERS', label: `Water Tanker Dispatches (${tankers.length})`, icon: Truck },
            { id: 'ALERTS', label: `Emergency Alerts (${alerts.length})`, icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: GRIEVANCES */}
        {activeTab === 'GRIEVANCES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Civic Grievance Tickets in {districtName}</h3>
                <p className="text-xs text-slate-400">Directly assign field officers and update resolution stages.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grievance..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredComplaints.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {c.category || 'CIVIC'}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" /> {c.ward || c.city}, {districtName}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{c.title || c.description}</h4>
                    <p className="text-slate-300">{c.description}</p>
                    <div className="text-[10px] text-slate-500">Submitted: {new Date(c.createdAt || Date.now()).toLocaleString()}</div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 shrink-0">
                    <span className="text-right font-black uppercase text-[10px] text-amber-400">
                      Status: {c.status || 'SUBMITTED'}
                    </span>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdateComplaint(c.id, 'In_Progress')}
                        className="px-2.5 py-1 bg-sky-900/60 hover:bg-sky-800 text-sky-200 rounded font-bold text-xs"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateComplaint(c.id, 'Resolved')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: TANKERS */}
        {activeTab === 'TANKERS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Drinking Water Tankers in {districtName}</h3>
            <div className="space-y-3">
              {tankers.map((t) => (
                <div key={t.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">{t.applicantName}</div>
                    <div className="text-slate-400">{t.wardOrVillage} • {t.capacityLitres}L</div>
                  </div>
                  <span className="text-blue-400 font-bold uppercase">{t.status || 'PENDING'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ALERTS */}
        {activeTab === 'ALERTS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Active District Disaster & Weather Alerts</h3>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-red-400 text-sm">{a.title}</div>
                    <div className="text-slate-400">{a.description}</div>
                  </div>
                  <span className="text-amber-400 font-bold">{a.severity || 'WARNING'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
