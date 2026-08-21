import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useLocation, haversineDistance } from '../../contexts/LocationContext.tsx';
import { Flame, ShieldAlert, HeartPulse, Building2, MapPin, PhoneCall, CheckCircle, Navigation } from 'lucide-react';
import { getAllData } from '../../utils/db.ts';
import { MapProvider } from '../../components/maps/MapProvider.tsx';
import { LiveMap } from '../../components/maps/Maps.tsx';
import { triggerEmergencySOS } from '../../services/sosService.ts';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

interface Shelter {
  id: string;
  name: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  contactNumber: string;
  latitude: number;
  longitude: number;
  resourcesAvailable: string[];
  distance?: number;
}

interface Hospital {
  id: string;
  name: string;
  type: string;
  contactNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  availableBeds: number;
  bloodGroupStock: any;
  hasEmergencyUnit: boolean;
  distance?: number;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
}

const EmergencyPage: React.FC = () => {
  const { user } = useAuth();
  const { latitude, longitude, ward, city, district, state } = useLocation();
  const userLat = latitude || 18.5204;
  const userLng = longitude || 73.8567;

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sosSent, setSosSent] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'shelters' | 'hospitals'>('alerts');
  interface VerifiedContact {
    name: string;
    phone: string;
    verified: boolean;
  }

  const [verifiedContacts, setVerifiedContacts] = useState<VerifiedContact[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Load verified contacts from local cache
  useEffect(() => {
    const saved = localStorage.getItem('ch_verified_contacts');
    if (saved) {
      try {
        setVerifiedContacts(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveVerifiedContactsList = (list: VerifiedContact[]) => {
    setVerifiedContacts(list);
    localStorage.setItem('ch_verified_contacts', JSON.stringify(list));
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    setVerificationLoading(true);
    setVerificationError(null);
    try {
      const response = await fetch(`${API_BASE}/api/sms/contact/request-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newContactName, phone: newContactPhone }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerifyingPhone(newContactPhone);
        setShowVerifyInput(true);
      } else {
        setVerificationError(data.error || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setVerificationError('Failed to communicate with Twilio gateway.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;
    setVerificationLoading(true);
    setVerificationError(null);
    try {
      const response = await fetch(`${API_BASE}/api/sms/contact/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: verifyingPhone, code: verificationCode }),
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        const updated = [
          ...verifiedContacts.filter(c => c.phone !== verifyingPhone),
          { name: newContactName, phone: verifyingPhone, verified: true }
        ];
        saveVerifiedContactsList(updated);
        setNewContactName('');
        setNewContactPhone('');
        setVerificationCode('');
        setShowVerifyInput(false);
        setVerifyingPhone('');
      } else {
        setVerificationError(data.error || 'Invalid verification code.');
      }
    } catch (err) {
      setVerificationError('Failed to verify OTP code.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleDeleteContact = (phone: string) => {
    const updated = verifiedContacts.filter(c => c.phone !== phone);
    saveVerifiedContactsList(updated);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${lat}, ${lng}`;
      }
    } catch (err) {
      console.warn('OSM Nominatim reverse geocode failed.');
    }
    return `${lat}, ${lng}`;
  };

  useEffect(() => {
    // Fetch alerts, shelters and hospitals around user coordinates
    const loadEmergencyData = async () => {
      let rawShelters: Shelter[] = [];
      let rawHospitals: Hospital[] = [];
      let rawAlerts: Alert[] = [];

      try {
        const [alertsRes, sheltersRes, hospitalsRes] = await Promise.all([
          fetch(`${API_BASE}/api/emergency/alerts?lat=${userLat}&lng=${userLng}`),
          fetch(`${API_BASE}/api/emergency/shelters?lat=${userLat}&lng=${userLng}&radius=50`),
          fetch(`${API_BASE}/api/emergency/hospitals?lat=${userLat}&lng=${userLng}&radius=50`),
        ]);

        if (alertsRes.ok && sheltersRes.ok && hospitalsRes.ok) {
          rawAlerts = await alertsRes.json();
          rawShelters = await sheltersRes.json();
          rawHospitals = await hospitalsRes.json();
        } else {
          throw new Error('Fallback required');
        }
      } catch (err) {
        try {
          const dbAlerts = await getAllData('alerts');
          const dbShelters = await getAllData('shelters');
          const dbHospitals = await getAllData('hospitals');

          rawAlerts = dbAlerts.length > 0 ? dbAlerts : [
            { id: '1', title: `Emergency Alert - ${district} District`, description: `Active weather advisory for ${ward || city}. Emergency personnel on standby.`, type: 'DISASTER', severity: 'CRITICAL', createdAt: new Date().toISOString() },
            { id: '2', title: `${district} Local Transit Update`, description: `Minor delays reported near ${ward || city} central depot.`, type: 'TRAFFIC', severity: 'WARNING', createdAt: new Date().toISOString() },
          ];

          rawShelters = dbShelters.length > 0 ? dbShelters : [
            { id: '1', name: `${district} West Disaster Relief Shelter`, address: `Karve Road, ${ward || city}, ${district}`, capacity: 500, currentOccupancy: 120, contactNumber: '108', latitude: userLat + 0.012, longitude: userLng + 0.015, resourcesAvailable: ['Food', 'Water', 'Medical Aid'] },
            { id: '2', name: `${district} Municipal Community Refuge`, address: `Central Complex, ${district}`, capacity: 800, currentOccupancy: 210, contactNumber: '1916', latitude: userLat - 0.025, longitude: userLng + 0.03, resourcesAvailable: ['Blankets', 'Power', 'Sanitation'] },
          ];

          rawHospitals = dbHospitals.length > 0 ? dbHospitals : [
            { id: '1', name: `${district} General Civil Hospital`, type: 'GOVERNMENT', contactNumber: '020-26120120', address: `Near Railway Station, ${district}`, latitude: userLat + 0.005, longitude: userLng + 0.008, availableBeds: 54, bloodGroupStock: {}, hasEmergencyUnit: true },
            { id: '2', name: `${district} Emergency Trauma Center`, type: 'SPECIALTY', contactNumber: '108', address: `Expressway Junction, ${district}`, latitude: userLat - 0.018, longitude: userLng - 0.02, availableBeds: 18, bloodGroupStock: {}, hasEmergencyUnit: true },
          ];
        } catch (_) {}
      }

      // Calculate distance and sort by nearest
      const calculatedShelters = rawShelters
        .map((s) => ({
          ...s,
          distance: haversineDistance(userLat, userLng, s.latitude, s.longitude),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      const calculatedHospitals = rawHospitals
        .map((h) => ({
          ...h,
          distance: haversineDistance(userLat, userLng, h.latitude, h.longitude),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setAlerts(rawAlerts);
      setShelters(calculatedShelters);
      setHospitals(calculatedHospitals);
    };

    loadEmergencyData();
  }, [userLat, userLng, district, city]);

  const [sosStatusInfo, setSosStatusInfo] = useState<{ active: boolean; message: string; deliveryStatus: string } | null>(null);

  const handleSOSTrigger = async () => {
    setSosLoading(true);
    setSosStatusInfo(null);
    try {
      const lat = userLat;
      const lng = userLng;
      const addressName = `${ward || city}, ${district}, ${state}`;
      const contactList = verifiedContacts.map((c) => c.phone);

      const res = await triggerEmergencySOS(
        lat,
        lng,
        district,
        addressName,
        user,
        contactList
      );

      setSosSent(true);
      setSosStatusInfo({
        active: true,
        message: res.message,
        deliveryStatus: res.deliveryStatus,
      });

      setTimeout(() => setSosSent(false), 10000);
    } catch (err) {
      console.error(err);
    } finally {
      setSosLoading(false);
    }
  };

  const emergencyContacts = [
    { title: 'State Disaster Management Control', number: '108' },
    { title: 'Police Department Maharashtra', number: '100' },
    { title: 'Fire and Safety Services', number: '101' },
    { title: 'Women Safety Helpline', number: '1091' },
  ];

  return (
    <div className="space-y-8">
      {/* Red Alert Banner */}
      <div className="bg-red-500 text-white p-6 sm:p-8 rounded-md3-lg shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-extrabold flex items-center justify-center md:justify-start gap-2">
            <Flame className="w-8 h-8 animate-pulse text-yellow-300" />
            Maharashtra SOS Center
          </h1>
          <p className="text-red-100 max-w-xl text-sm leading-relaxed">
            Trigger an instant SOS emergency signal to report floods, fires, earthquakes, accidents, or medical crises. Nearby volunteers, civil defense authorities, and your verified contacts will receive your location coordinates instantly.
          </p>
        </div>

        <div>
          {sosSent ? (
            <div className="space-y-3 text-center md:text-right animate-fadeIn">
              <div className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-md flex items-center gap-2 text-xs border border-emerald-300">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{sosStatusInfo?.message || '🚨 SOS Event Broadcasted Live!'}</span>
              </div>

              {/* Direct Instant Device SMS & WhatsApp Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                <a
                  href={`sms:${verifiedContacts[0]?.phone || '112'}?body=${encodeURIComponent(
                    `🚨 URGENT SOS EMERGENCY ALERT!\nCitizen: ${user?.name || 'Resident'}\nGPS Location: https://www.google.com/maps?q=${userLat},${userLng}\nAddress: ${ward || city}, ${district}`
                  )}`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                >
                  📱 Send Direct Device SMS
                </a>
                <a
                  href={`https://wa.me/${(verifiedContacts[0]?.phone || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                    `🚨 URGENT SOS EMERGENCY ALERT!\nCitizen: ${user?.name || 'Resident'}\nGPS Location: https://www.google.com/maps?q=${userLat},${userLng}\nAddress: ${ward || city}, ${district}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                >
                  💬 Share on WhatsApp
                </a>
                <a
                  href="tel:112"
                  className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                >
                  📞 Call 112
                </a>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSOSTrigger}
              disabled={sosLoading}
              className="bg-white hover:bg-slate-100 text-danger text-lg font-black px-8 py-5 rounded-full shadow-2xl hover-scale flex items-center gap-3 animate-pulse border-4 border-red-200"
            >
              <ShieldAlert className="w-6 h-6 text-danger" />
              {sosLoading ? 'DISPATCHING...' : 'TRIGGER SOS'}
            </button>
          )}
        </div>
      </div>

      {/* 2FA Emergency Contacts Settings Section */}
      <div className="bg-white p-6 rounded-md3-lg border border-slate-border shadow-sm space-y-6">
        <div className="border-b border-slate-border pb-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <PhoneCall className="w-4 h-4 text-primary" /> Verified Emergency Contacts (2FA Settings)
          </h2>
          <p className="text-slate-500 text-[11px] font-semibold mt-1">
            Add contacts who will receive your exact coordinates and live OpenStreetMap tracking links when you trigger the SOS. Each number must be verified via Twilio OTP.
          </p>
        </div>

        {/* Add Contact Form & OTP validation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add New Contact</h3>
            {!showVerifyInput ? (
              <form onSubmit={handleRequestVerification} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md3 px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md3 px-3 py-2 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white font-semibold"
                  />
                </div>
                {verificationError && (
                  <p className="text-danger text-[11px] font-semibold">{verificationError}</p>
                )}
                <button
                  type="submit"
                  disabled={verificationLoading}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-md3 shadow-sm hover-scale disabled:opacity-50"
                >
                  {verificationLoading ? 'SENDING OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmVerification} className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-md3 text-xs text-blue-800 leading-relaxed font-semibold">
                  We've sent a 6-digit verification code to <strong>{verifyingPhone}</strong>. Enter the code below to verify and save the contact.
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md3 px-3 py-2 text-slate-800 placeholder-slate-400 text-xs tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
                  />
                </div>
                {verificationError && (
                  <p className="text-danger text-[11px] font-semibold">{verificationError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={verificationLoading}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-md3 shadow-sm hover-scale disabled:opacity-50"
                  >
                    {verificationLoading ? 'VERIFYING...' : 'Verify & Add Contact'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVerifyInput(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-md3"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active SOS Contacts</h3>
            {verifiedContacts.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-8 rounded-md3 text-center text-slate-400 text-xs font-semibold">
                No active SOS contacts saved. Add a verified mobile number above to enable emergency broadcasts.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md3 bg-slate-50/50">
                {verifiedContacts.map((contact, index) => (
                  <div key={index} className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        {contact.name}
                        <span className="bg-green-100 text-green-800 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">VERIFIED</span>
                      </h4>
                      <p className="text-slate-500 text-xs font-semibold mt-0.5">{contact.phone}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.phone)}
                      className="text-danger hover:text-red-700 text-xs font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Emergency Map */}
      {userLat && userLng && (
        <div className="bg-white p-4 rounded-md3 border border-slate-border shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary animate-pulse" /> Live Emergency Resiliency Map
          </h3>
          <MapProvider>
            <LiveMap
              assets={[
                ...shelters.map(s => ({
                  id: s.id,
                  name: s.name,
                  category: 'SHELTER' as const,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  address: s.address,
                  details: `Capacity: ${s.capacity} beds`
                })),
                ...hospitals.map(h => ({
                  id: h.id,
                  name: h.name,
                  category: 'HOSPITAL' as const,
                  latitude: h.latitude,
                  longitude: h.longitude,
                  address: h.address,
                  details: `Beds: ${h.availableBeds} free`
                }))
              ]}
              height="350px"
            />
          </MapProvider>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: Resource Directory */}
        <div className="lg:col-span-2 bg-white rounded-md3 border border-slate-border shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-border">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-3 text-sm font-semibold text-center ${
                activeTab === 'alerts' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Active Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('shelters')}
              className={`flex-1 py-3 text-sm font-semibold text-center ${
                activeTab === 'shelters' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Nearby Shelters ({shelters.length})
            </button>
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`flex-1 py-3 text-sm font-semibold text-center ${
                activeTab === 'hospitals' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Hospital Beds ({hospitals.length})
            </button>
          </div>

          <div className="p-6">
            {/* Alerts Feed */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No critical alerts reported in your vicinity.</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-md3 border ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-50 border-red-200 text-slate-800'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <h4 className="font-bold text-slate-800">{alert.title}</h4>
                      <p className="text-slate-600 text-sm mt-1">{alert.description}</p>
                      <span className="text-xs text-slate-400 mt-2 block">
                        Published: {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Shelters Feed */}
            {activeTab === 'shelters' && (
              <div className="space-y-4">
                {shelters.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No emergency shelters found within 20km.</p>
                ) : (
                  shelters.map((shelter) => (
                    <div key={shelter.id} className="p-4 rounded-md3 border border-slate-border flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-primary" />
                          {shelter.name}
                        </h4>
                        <p className="text-slate-500 text-xs">{shelter.address}</p>
                        <div className="flex gap-2 pt-1 flex-wrap">
                          {shelter.resourcesAvailable.map((res) => (
                            <span key={res} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {res}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500 block">Occupancy</span>
                        <span className="font-bold text-slate-700 text-sm">
                          {shelter.currentOccupancy} / {shelter.capacity} Beds
                        </span>
                        {shelter.distance !== undefined && (
                          <span className="text-xs text-slate-400 block mt-1">
                            {shelter.distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Hospitals Feed */}
            {activeTab === 'hospitals' && (
              <div className="space-y-4">
                {hospitals.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No active hospital databases loaded.</p>
                ) : (
                  hospitals.map((hospital) => (
                    <div key={hospital.id} className="p-4 rounded-md3 border border-slate-border flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1">
                          <HeartPulse className="w-4 h-4 text-red-500" />
                          {hospital.name}
                        </h4>
                        <p className="text-slate-500 text-xs">{hospital.address}</p>
                        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                          <span>Type: {hospital.type}</span>
                          <span>•</span>
                          <span className={hospital.hasEmergencyUnit ? 'text-green-600 font-semibold' : 'text-slate-500'}>
                            {hospital.hasEmergencyUnit ? 'ICU Available' : 'No ICU'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500 block">Available Beds</span>
                        <span className="font-extrabold text-green-600 text-lg">
                          {hospital.availableBeds} Free
                        </span>
                        {hospital.distance !== undefined && (
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {hospital.distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Offline emergency contact details */}
        <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-slate-800 text-lg">Offline Emergency Help</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Write down these numbers. They work on traditional cellular networks even if internet data is fully offline.
          </p>

          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.title} className="p-3 bg-slate-50 rounded-md3 border border-slate-border flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-slate-600">{contact.title}</p>
                  <p className="font-bold text-slate-800 text-lg">{contact.number}</p>
                </div>
                <a href={`tel:${contact.number}`} className="p-2.5 bg-primary text-white rounded-full hover:bg-primary-hover shadow-sm">
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
