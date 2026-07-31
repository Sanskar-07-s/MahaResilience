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
  const [sosContact, setSosContact] = useState('');
  const [contactsSaved, setContactsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ch_sos_contacts');
    if (saved) {
      setSosContact(saved);
    }
  }, []);

  const saveSosContacts = () => {
    localStorage.setItem('ch_sos_contacts', sosContact);
    setContactsSaved(true);
    setTimeout(() => setContactsSaved(false), 3000);
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
      // 1. Trigger local system alert
      const response = await fetch(`${API_BASE}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ch_token') || ''}`,
        },
        body: JSON.stringify({
          latitude: coords?.lat || 18.5204,
          longitude: coords?.lng || 73.8567,
          address: 'User Current SOS Geo-Beacon',
        }),
      });

      // 2. Broadcast SOS via Twilio SMS if numbers are provided
      const contactList = sosContact.split(',').map(c => c.trim()).filter(c => c.length > 0);
      await fetch(`${API_BASE}/api/sms/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: `${coords?.lat || 18.5204}, ${coords?.lng || 73.8567}`,
          reporter: user?.name || 'Anonymous Citizen',
          emergencyContacts: contactList.length > 0 ? contactList : undefined
        }),
      });

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
            Trigger an instant SOS emergency signal to report floods, fires, earthquakes, accidents, or medical crises. Nearby volunteers and civil defense authorities will receive your coordinates immediately.
          </p>
          <div className="pt-3 max-w-sm space-y-2">
            <label className="block text-[10px] font-extrabold text-red-100 uppercase tracking-widest">SOS Contacts (SMS Setting)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sosContact}
                onChange={(e) => setSosContact(e.target.value)}
                placeholder="e.g. +919876543210 (comma separated)"
                className="flex-1 bg-white/10 border border-white/20 rounded-md3 px-3.5 py-2 text-white placeholder-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-white/40 transition-all font-semibold"
              />
              <button
                onClick={saveSosContacts}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3.5 py-2 rounded-md3 text-xs font-bold transition-all shadow-sm whitespace-nowrap"
              >
                {contactsSaved ? '✓ Saved' : 'Save Number'}
              </button>
            </div>
          </div>
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
