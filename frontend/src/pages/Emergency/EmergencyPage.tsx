import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { Flame, ShieldAlert, HeartPulse, Building2, MapPin, PhoneCall, CheckCircle } from 'lucide-react';
import { getAllData } from '../../utils/db.ts';
import { MapProvider } from '../../components/maps/MapProvider.tsx';
import { LiveMap } from '../../components/maps/Maps.tsx';

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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
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
    // 1. Get current citizen coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to Pune coordinates if blocked
          setCoords({ lat: 18.5204, lng: 73.8567 });
        }
      );
    } else {
      setCoords({ lat: 18.5204, lng: 73.8567 });
    }
  }, []);

  useEffect(() => {
    if (!coords) return;

    // Fetch alerts, shelters and hospitals
    const loadEmergencyData = async () => {
      try {
        const [alertsRes, sheltersRes, hospitalsRes] = await Promise.all([
          fetch(`${API_BASE}/api/emergency/alerts?lat=${coords.lat}&lng=${coords.lng}`),
          fetch(`${API_BASE}/api/emergency/shelters?lat=${coords.lat}&lng=${coords.lng}&radius=20`),
          fetch(`${API_BASE}/api/emergency/hospitals?lat=${coords.lat}&lng=${coords.lng}&radius=20`),
        ]);

        if (!alertsRes.ok || !sheltersRes.ok || !hospitalsRes.ok) {
          throw new Error('Network response not ok');
        }

        setAlerts(await alertsRes.json());
        setShelters(await sheltersRes.json());
        setHospitals(await hospitalsRes.json());
      } catch (err) {
        console.warn('Network offline. Pulling from local IndexedDB databases...');
        try {
          const dbAlerts = await getAllData('alerts');
          const dbShelters = await getAllData('shelters');
          const dbHospitals = await getAllData('hospitals');

          setAlerts(dbAlerts.length > 0 ? dbAlerts : [
            { id: '1', title: 'Severe Cyclone Alert - Konkan Coast', description: 'Monsoon cyclone warning issued for the next 24 hours. Fisherman are advised not to venture into the sea. Safe shelters are open.', type: 'DISASTER', severity: 'CRITICAL', createdAt: new Date().toISOString() },
            { id: '2', title: 'Pune Metro Line 1 Delay Warning', description: 'Minor signaling issue near Shivaji Nagar. Expect delays of 10-15 minutes.', type: 'TRAFFIC', severity: 'WARNING', createdAt: new Date().toISOString() },
          ]);
          setShelters(dbShelters.length > 0 ? dbShelters : [
            { id: '1', name: 'Bandra Reclamation Primary Shelter', address: 'KC Road, Bandra West, Mumbai', capacity: 300, currentOccupancy: 120, contactNumber: '022-26510012', latitude: 19.052, longitude: 72.825, resourcesAvailable: ['Food', 'Water', 'Medical Aid'], distance: 1.2 },
            { id: '2', name: 'Dharavi Sports Complex Safe Zone', address: 'Sion Road, Dharavi, Mumbai', capacity: 600, currentOccupancy: 85, contactNumber: '022-24018890', latitude: 19.038, longitude: 72.854, resourcesAvailable: ['Blankets', 'Sanitation', 'Power Outlets'], distance: 3.8 },
          ]);
          setHospitals(dbHospitals.length > 0 ? dbHospitals : [
            { id: '1', name: 'Lilavati Hospital & Research Center', type: 'PRIVATE', contactNumber: '022-26751000', address: 'A-791, Bandra West, Mumbai', latitude: 19.051, longitude: 72.822, availableBeds: 24, bloodGroupStock: {}, hasEmergencyUnit: true, distance: 0.9 },
            { id: '2', name: 'Bhabha Municipal General Hospital', type: 'GOVERNMENT', contactNumber: '022-26422775', address: 'Waterfield Road, Bandra West, Mumbai', latitude: 19.059, longitude: 72.831, availableBeds: 12, bloodGroupStock: {}, hasEmergencyUnit: true, distance: 1.5 },
          ]);
        } catch (dbErr) {
          console.error('[Emergency Page] IndexedDB query error:', dbErr);
        }
      }
    };

    loadEmergencyData();
  }, [coords]);

  const handleSOSTrigger = async () => {
    setSosLoading(true);
    try {
      const lat = coords?.lat || 18.5204;
      const lng = coords?.lng || 73.8567;

      // Translate coordinates to human-readable address via OSM reverse geocoding API
      const addressName = await reverseGeocode(lat, lng);

      // 1. Trigger local system alert
      const response = await fetch(`${API_BASE}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ch_token') || ''}`,
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          address: addressName,
        }),
      });

      // 2. Broadcast SOS via Twilio SMS using user's verified contacts list
      const contactList = verifiedContacts.map(c => c.phone);
      if (contactList.length > 0) {
        await fetch(`${API_BASE}/api/sms/sos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: `${lat}, ${lng}`,
            reporter: user?.name || 'Anonymous Citizen',
            emergencyContacts: contactList
          }),
        });
      }

      if (response.ok) {
        setSosSent(true);
        setTimeout(() => setSosSent(false), 8000);
      }
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
            <div className="bg-white text-danger px-6 py-4 rounded-md3 font-bold shadow-md flex items-center gap-2 animate-bounce">
              <CheckCircle className="w-6 h-6 text-green-600" />
              SOS Broadcast Active! Rescue dispatched.
            </div>
          ) : (
            <button
              onClick={handleSOSTrigger}
              disabled={sosLoading}
              className="bg-white hover:bg-slate-100 text-danger text-lg font-black px-8 py-5 rounded-full shadow-2xl hover-scale flex items-center gap-3 animate-pulse border-4 border-red-200"
            >
              <ShieldAlert className="w-6 h-6 text-danger" />
              {sosLoading ? 'SENDING...' : 'TRIGGER SOS'}
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
      {coords && (
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
