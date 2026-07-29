import React, { useState } from 'react';
import { Compass, MapPin, Search } from 'lucide-react';

const TourismPage: React.FC = () => {
  const attractions = [
    { name: 'Gateway of India', desc: 'Historic 20th-century arch monument overlooking the Arabian Sea, built to commemorate King George V visit.', category: 'Heritage', rating: '4.8/5', image: 'https://images.unsplash.com/photo-1595658658481-d53d3f999874?auto=format&fit=crop&q=80&w=400' },
    { name: 'Ellora Caves', desc: 'UNESCO heritage site. Rock-cut temple complex representing Rashtrakuta achievements.', category: 'Heritage', rating: '4.9/5', image: 'https://images.unsplash.com/photo-1600100397990-a472c602330a?auto=format&fit=crop&q=80&w=400' },
    { name: 'Mahabaleshwar Hills', desc: 'Strawberry capital and famous hill station nestled along the scenic Western Ghats range.', category: 'Nature', rating: '4.6/5', image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Explore Maharashtra Tourism</h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore historical monuments, UNESCO world heritage sites, beaches, and wildlife sanctuaries across Maharashtra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attractions.map((place) => (
          <div key={place.name} className="bg-white rounded-md3 border border-slate-border shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="h-48 bg-slate-100 relative overflow-hidden">
              <img src={place.image} alt={place.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
              <span className="absolute top-3 left-3 text-xs font-bold bg-primary text-white px-2.5 py-0.5 rounded shadow">
                {place.category}
              </span>
            </div>

            <div className="p-6 space-y-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                <Compass className="w-5 h-5 text-primary" />
                {place.name}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">{place.desc}</p>
              
              <div className="flex justify-between items-center pt-2 text-xs font-semibold border-t border-slate-100 text-slate-600">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Maharashtra</span>
                <span>Rating: {place.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourismPage;
