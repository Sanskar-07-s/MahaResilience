import React, { useState, useEffect } from 'react';
import {
  HeartPulse, CheckCircle, Plus, Search, MapPin, Phone, Shield,
  Activity, AlertTriangle, Building, Droplet, Truck, Edit3, Trash2
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase.ts';
import { useAuth } from '../../../contexts/AuthContext.tsx';

interface Hospital {
  id: string;
  name: string;
  type: 'GOVT_HOSPITAL' | 'PRIVATE_EMERGENCY' | 'PHC_RURAL' | 'SPECIALTY';
  district: string;
  taluka: string;
  address: string;
  contactNumber: string;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  oxygenBedsTotal: number;
  oxygenBedsAvailable: number;
  ventilatorsAvailable: number;
  hasBloodBank: boolean;
  hasTraumaCenter: boolean;
  isVerified: boolean;
  updatedAt?: string;
}

export const HealthcareAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'FACILITIES' | 'BED_TELEMETRY' | 'BLOOD_EMERGENCY'>('FACILITIES');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  // New Facility Modal
  const [showModal, setShowModal] = useState(false);
  const [hospName, setHospName] = useState('');
  const [hospType, setHospType] = useState<'GOVT_HOSPITAL' | 'PRIVATE_EMERGENCY' | 'PHC_RURAL' | 'SPECIALTY'>('GOVT_HOSPITAL');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const [taluka, setTaluka] = useState('Haveli');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('108');
  const [icuTotal, setIcuTotal] = useState<number>(30);
  const [icuAvail, setIcuAvail] = useState<number>(8);
  const [oxyTotal, setOxyTotal] = useState<number>(100);
  const [oxyAvail, setOxyAvail] = useState<number>(34);
  const [ventAvail, setVentAvail] = useState<number>(5);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'hospitals'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hospital));
      if (list.length === 0) {
        setHospitals([
          { id: 'hosp_1', name: 'Sassoon General Hospital & Medical College', type: 'GOVT_HOSPITAL', district: 'Pune', taluka: 'Pune City', address: 'Station Road, Pune', contactNumber: '020-26128000', icuBedsTotal: 65, icuBedsAvailable: 14, oxygenBedsTotal: 250, oxygenBedsAvailable: 82, ventilatorsAvailable: 12, hasBloodBank: true, hasTraumaCenter: true, isVerified: true },
          { id: 'hosp_2', name: 'Chhatrapati Pramila Raje (CPR) Civil Hospital', type: 'GOVT_HOSPITAL', district: 'Kolhapur', taluka: 'Karvir', address: 'Bhavani Mandap Road, Kolhapur', contactNumber: '0231-2641011', icuBedsTotal: 40, icuBedsAvailable: 7, oxygenBedsTotal: 180, oxygenBedsAvailable: 45, ventilatorsAvailable: 6, hasBloodBank: true, hasTraumaCenter: true, isVerified: true },
          { id: 'hosp_3', name: 'District Civil Hospital Nashik', type: 'GOVT_HOSPITAL', district: 'Nashik', taluka: 'Nashik', address: 'Trimbak Road, Nashik', contactNumber: '0253-2573211', icuBedsTotal: 35, icuBedsAvailable: 4, oxygenBedsTotal: 140, oxygenBedsAvailable: 29, ventilatorsAvailable: 4, hasBloodBank: true, hasTraumaCenter: true, isVerified: true },
          { id: 'hosp_4', name: 'Rural Primary Health Center (PHC)', type: 'PHC_RURAL', district: 'Satara', taluka: 'Patan', address: 'Koynanagar, Patan', contactNumber: '02162-230111', icuBedsTotal: 4, icuBedsAvailable: 2, oxygenBedsTotal: 20, oxygenBedsAvailable: 11, ventilatorsAvailable: 1, hasBloodBank: false, hasTraumaCenter: false, isVerified: true },
        ]);
      } else {
        setHospitals(list);
      }
    });

    return () => unsub();
  }, []);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospName.trim()) return;

    try {
      const id = 'hosp_' + Date.now();
      const newHosp: Hospital = {
        id,
        name: hospName.trim(),
        type: hospType,
        district: district.trim(),
        taluka: taluka.trim(),
        address: address.trim() || `${district} Medical Zone`,
        contactNumber: phone.trim(),
        icuBedsTotal: Number(icuTotal) || 10,
        icuBedsAvailable: Number(icuAvail) || 2,
        oxygenBedsTotal: Number(oxyTotal) || 50,
        oxygenBedsAvailable: Number(oxyAvail) || 10,
        ventilatorsAvailable: Number(ventAvail) || 2,
        hasBloodBank: true,
        hasTraumaCenter: true,
        isVerified: true,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'hospitals', id), newHosp);
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'HEALTH_ADMIN',
        adminRole: 'HEALTHCARE_ADMIN',
        adminField: 'HEALTHCARE',
        action: 'ADD_HEALTHCARE_FACILITY',
        targetId: id,
        timestamp: new Date().toISOString(),
        details: `Added ${hospType} facility: ${hospName} in ${district}`,
      });

      setShowModal(false);
      setHospName('');
      setAddress('');
    } catch (err: any) {
      alert('Error creating facility: ' + err.message);
    }
  };

  const handleToggleVerification = async (hosp: Hospital) => {
    try {
      const nextVal = !hosp.isVerified;
      await updateDoc(doc(db, 'hospitals', hosp.id), {
        isVerified: nextVal,
        updatedAt: new Date().toISOString(),
      });
      await addDoc(collection(db, 'auditLogs'), {
        adminId: user?.uid || 'HEALTH_ADMIN',
        adminRole: 'HEALTHCARE_ADMIN',
        adminField: 'HEALTHCARE',
        action: nextVal ? 'VERIFY_HOSPITAL' : 'REVOKE_HOSPITAL_VERIFY',
        targetId: hosp.id,
        timestamp: new Date().toISOString(),
        details: `Updated verification of ${hosp.name}`,
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleQuickUpdateBeds = async (hospId: string, icuDelta: number, oxyDelta: number) => {
    const hosp = hospitals.find((h) => h.id === hospId);
    if (!hosp) return;
    const newIcu = Math.max(0, Math.min(hosp.icuBedsTotal, hosp.icuBedsAvailable + icuDelta));
    const newOxy = Math.max(0, Math.min(hosp.oxygenBedsTotal, hosp.oxygenBedsAvailable + oxyDelta));

    try {
      await updateDoc(doc(db, 'hospitals', hospId), {
        icuBedsAvailable: newIcu,
        oxygenBedsAvailable: newOxy,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert('Error updating beds: ' + err.message);
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.taluka?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || h.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-red-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/30 rounded-xl border border-red-400/40 text-red-400">
              <HeartPulse className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-500/20 text-red-300 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  SPECIALIZED HEALTHCARE ADMIN
                </span>
                <span className="text-xs text-red-200">Public Health Department & 108 Emergency</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                State Healthcare & Emergency Bed Registry
              </h1>
              <p className="text-red-200 text-xs mt-0.5">
                Monitor live ICU/Oxygen bed availability, critical blood bank reserves, and 108 EMS ambulance units.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-900/40"
          >
            <Plus className="w-4 h-4" /> Add Medical Facility
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-red-400" /> Monitored Hospitals & PHCs
            </div>
            <div className="text-2xl font-black text-white mt-1">{hospitals.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Available ICU Beds
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {hospitals.reduce((sum, h) => sum + (h.icuBedsAvailable || 0), 0)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Oxygen Beds Vacant
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {hospitals.reduce((sum, h) => sum + (h.oxygenBedsAvailable || 0), 0)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-yellow-400" /> 108 Emergency Ambulances
            </div>
            <div className="text-2xl font-black text-yellow-400 mt-1">99.4% Operational</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'FACILITIES', label: 'Hospitals & Medical Centers', icon: Building },
            { id: 'BED_TELEMETRY', label: 'Live ICU & Oxygen Telemetry', icon: Activity },
            { id: 'BLOOD_EMERGENCY', label: 'Blood Bank & 108 Fleet', icon: Droplet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${
                  active
                    ? 'bg-red-600 text-white border-red-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: FACILITIES */}
        {activeTab === 'FACILITIES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto text-xs">
                {['ALL', 'GOVT_HOSPITAL', 'PRIVATE_EMERGENCY', 'PHC_RURAL'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      selectedType === t ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospital, district, taluka..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">Hospital / Facility</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">ICU Available</th>
                    <th className="p-3">Oxygen Beds</th>
                    <th className="p-3">Emergency Contact</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredHospitals.map((hosp) => (
                    <tr key={hosp.id} className="hover:bg-slate-850/50">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {hosp.name}
                          {hosp.isVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400">{hosp.address}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          {hosp.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{hosp.taluka}, {hosp.district}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {hosp.icuBedsAvailable} / {hosp.icuBedsTotal}
                      </td>
                      <td className="p-3 font-mono text-rose-300 font-bold">
                        {hosp.oxygenBedsAvailable} / {hosp.oxygenBedsTotal}
                      </td>
                      <td className="p-3 font-mono text-slate-300">{hosp.contactNumber}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            hosp.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {hosp.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVerification(hosp)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[11px]"
                        >
                          {hosp.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE BED TELEMETRY */}
        {activeTab === 'BED_TELEMETRY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Live Bed Telemetry & Quick Real-Time Adjustment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHospitals.map((hosp) => (
                <div key={hosp.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold text-sm">{hosp.name}</h4>
                      <p className="text-xs text-slate-400">{hosp.district} • {hosp.type}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Available ICU Beds</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">{hosp.icuBedsAvailable} / {hosp.icuBedsTotal}</div>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleQuickUpdateBeds(hosp.id, -1, 0)}
                          className="px-2 py-0.5 bg-red-950 hover:bg-red-900 text-red-300 rounded font-bold text-xs"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickUpdateBeds(hosp.id, 1, 0)}
                          className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded font-bold text-xs"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Oxygen Beds Available</div>
                      <div className="text-xl font-black text-rose-400 mt-1">{hosp.oxygenBedsAvailable} / {hosp.oxygenBedsTotal}</div>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleQuickUpdateBeds(hosp.id, 0, -1)}
                          className="px-2 py-0.5 bg-red-950 hover:bg-red-900 text-red-300 rounded font-bold text-xs"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickUpdateBeds(hosp.id, 0, 1)}
                          className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded font-bold text-xs"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BLOOD & 108 AMBULANCE */}
        {activeTab === 'BLOOD_EMERGENCY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Blood Bank Reserves & Emergency Dispatch Units</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { group: 'A+ Positive', units: '142 Units', status: 'SUFFICIENT', color: 'text-emerald-400' },
                { group: 'B+ Positive', units: '210 Units', status: 'SUFFICIENT', color: 'text-emerald-400' },
                { group: 'O+ Positive', units: '98 Units', status: 'MODERATE', color: 'text-yellow-400' },
                { group: 'O- Negative (Universal)', units: '12 Units', status: 'LOW STOCK', color: 'text-red-400' },
                { group: 'AB+ Positive', units: '76 Units', status: 'SUFFICIENT', color: 'text-emerald-400' },
                { group: 'AB- Negative', units: '8 Units', status: 'CRITICAL LOW', color: 'text-red-500' },
                { group: 'A- Negative', units: '15 Units', status: 'LOW STOCK', color: 'text-red-400' },
                { group: 'B- Negative', units: '18 Units', status: 'LOW STOCK', color: 'text-red-400' },
              ].map((b) => (
                <div key={b.group} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-bold">{b.group}</div>
                  <div className="text-lg font-black text-white">{b.units}</div>
                  <div className={`text-[10px] font-extrabold ${b.color}`}>{b.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE FACILITY MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Register Medical Facility</h3>
            <form onSubmit={handleCreateFacility} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Hospital / PHC Name</label>
                <input
                  type="text"
                  required
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  placeholder="e.g. Pune Municipal Corporation Hospital"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Facility Type</label>
                  <select
                    value={hospType}
                    onChange={(e) => setHospType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="GOVT_HOSPITAL">Government Hospital</option>
                    <option value="PRIVATE_EMERGENCY">Private Emergency Hospital</option>
                    <option value="PHC_RURAL">Primary Health Center (PHC)</option>
                    <option value="SPECIALTY">Specialty Hospital</option>
                  </select>
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
                <label className="block text-slate-300 font-bold mb-1">Address / Location</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Road, Landmark, Taluka"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Total ICU Beds</label>
                  <input
                    type="number"
                    value={icuTotal}
                    onChange={(e) => setIcuTotal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Available ICU</label>
                  <input
                    type="number"
                    value={icuAvail}
                    onChange={(e) => setIcuAvail(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
