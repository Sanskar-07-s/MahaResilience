import React, { useState, useEffect } from 'react';
import { HeartPulse, Search, Calendar, Phone, Activity } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  type: string;
  contactNumber: string;
  address: string;
  availableBeds: number;
  hasEmergencyUnit: boolean;
}

const HealthcarePage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch('/api/emergency/hospitals');
        if (response.ok) {
          setHospitals(await response.json());
        } else {
          setHospitals([
            { id: '1', name: 'KEM Hospital Mumbai', type: 'GOVERNMENT', contactNumber: '022-24107000', address: 'Acharya Donde Marg, Parel, Mumbai', availableBeds: 45, hasEmergencyUnit: true },
            { id: '2', name: 'Bandra PHC Clinic', type: 'PHC', contactNumber: '022-26422340', address: 'Bandra West, Mumbai', availableBeds: 4, hasEmergencyUnit: false },
            { id: '3', name: 'Pune General Hospital', type: 'GOVERNMENT', contactNumber: '020-26120120', address: 'Shivajinagar, Pune', availableBeds: 22, hasEmergencyUnit: true },
          ]);
        }
      } catch (err) {
        setHospitals([
          { id: '1', name: 'KEM Hospital Mumbai', type: 'GOVERNMENT', contactNumber: '022-24107000', address: 'Acharya Donde Marg, Parel, Mumbai', availableBeds: 45, hasEmergencyUnit: true },
          { id: '2', name: 'Bandra PHC Clinic', type: 'PHC', contactNumber: '022-26422340', address: 'Bandra West, Mumbai', availableBeds: 4, hasEmergencyUnit: false },
          { id: '3', name: 'Pune General Hospital', type: 'GOVERNMENT', contactNumber: '020-26120120', address: 'Shivajinagar, Pune', availableBeds: 22, hasEmergencyUnit: true },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Healthcare Resources & Bed Availabilities</h1>
        <p className="text-slate-500 text-sm mt-1">
          Locate your nearest Primary Health Centers (PHCs), Government and private hospitals in Maharashtra with active ICU and general bed counters.
        </p>
      </div>

      <div className="flex gap-4 max-w-md bg-white p-2.5 rounded-md3 border border-slate-border shadow-sm">
        <Search className="text-slate-400 w-5 h-5 self-center ml-2" />
        <input
          type="text"
          placeholder="Search by hospital name or locality..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-sm text-slate-700 bg-transparent"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((hospital) => (
            <div key={hospital.id} className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] bg-red-100 text-danger px-2.5 py-0.5 rounded font-bold uppercase">
                  {hospital.type}
                </span>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5 pt-1">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                  {hospital.name}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">{hospital.address}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Available Beds:</span>
                  <span className="font-bold text-green-600">{hospital.availableBeds} ICU/General</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact:</span>
                  <span className="font-semibold text-slate-700">{hospital.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>ICU Facility:</span>
                  <span className="font-semibold text-slate-700">{hospital.hasEmergencyUnit ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="pt-2">
                <a href={`tel:${hospital.contactNumber}`} className="w-full text-center bg-slate-50 hover:bg-slate-100 border border-slate-border py-2 rounded-md3 text-xs font-semibold flex items-center justify-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Call Hospital
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthcarePage;
