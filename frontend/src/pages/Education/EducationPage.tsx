import React, { useState } from 'react';
import { GraduationCap, MapPin, Search, BookOpen, Award, Navigation, Building } from 'lucide-react';
import { useLocation, haversineDistance } from '../../contexts/LocationContext.tsx';

interface EduInstitute {
  id: string;
  name: string;
  category: 'SCHOOL' | 'COLLEGE' | 'LIBRARY' | 'TRAINING';
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance?: number;
}

export const EducationPage: React.FC = () => {
  const { latitude, longitude, ward, city, district } = useLocation();
  const userLat = latitude || 18.5204;
  const userLng = longitude || 73.8567;

  const [category, setCategory] = useState('ALL');

  const rawInstitutes: EduInstitute[] = [
    { id: '1', name: `${district} Govt Engineering College`, category: 'COLLEGE', address: `College Road, ${ward || city}, ${district}`, latitude: userLat + 0.008, longitude: userLng + 0.012, rating: 4.8 },
    { id: '2', name: `${district} Central Public Library`, category: 'LIBRARY', address: `Town Hall Campus, ${district}`, latitude: userLat - 0.006, longitude: userLng - 0.005, rating: 4.6 },
    { id: '3', name: `${ward || city} Zilla Parishad Secondary School`, category: 'SCHOOL', address: `School Block, ${ward || city}`, latitude: userLat + 0.003, longitude: userLng - 0.007, rating: 4.4 },
    { id: '4', name: `${district} ITI Skill Development Center`, category: 'TRAINING', address: `MIDC Area, ${district}`, latitude: userLat + 0.025, longitude: userLng + 0.018, rating: 4.5 },
  ];

  const calculated = rawInstitutes
    .map((inst) => ({
      ...inst,
      distance: haversineDistance(userLat, userLng, inst.latitude, inst.longitude),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const filtered = calculated.filter(
    (inst) => category === 'ALL' || inst.category === category
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-800 via-indigo-700 to-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> Education Resources for {ward || city}, {district}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Education Institutions & Study Centers</h1>
        <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
          Discover government schools, engineering & degree colleges, public libraries, and ITI vocational training centers near {district}.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto text-xs pb-1">
        {[
          { label: 'All Institutions', value: 'ALL' },
          { label: 'Colleges & Universities', value: 'COLLEGE' },
          { label: 'Public Libraries', value: 'LIBRARY' },
          { label: 'Schools', value: 'SCHOOL' },
          { label: 'Vocational Training', value: 'TRAINING' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setCategory(f.value)}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 ${
              category === f.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((inst) => (
          <div key={inst.id} className="bg-white p-5 rounded-2xl border border-slate-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">
                  {inst.category}
                </span>
                <h4 className="font-bold text-slate-800 text-base mt-1">{inst.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{inst.address}</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 flex items-center gap-1 shrink-0">
                <Navigation className="w-3 h-3" /> {inst.distance} km
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100 text-xs">
              <span className="text-amber-500 font-bold">★ {inst.rating} / 5.0</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inst.name + ' ' + inst.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                Directions <Navigation className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationPage;
