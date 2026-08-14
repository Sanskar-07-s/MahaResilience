import React from 'react';
import { Wheat, MapPin, TrendingUp, Sun, CloudRain, Award, ExternalLink } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';

export const AgriculturePage: React.FC = () => {
  const { taluka, district, state } = useLocation();

  const mandiPrices = [
    { crop: 'Soybean (yellow)', price: '₹4,550 / Qtl', trend: '+₹80', APMC: `${district} Central APMC` },
    { crop: 'Cotton (Medium Staple)', price: '₹7,200 / Qtl', trend: '+₹150', APMC: `${district} APMC Yard` },
    { crop: 'Onion (Red)', price: '₹1,850 / Qtl', trend: '-₹40', APMC: `${taluka} APMC Mandi` },
    { crop: 'Wheat (Sharbati)', price: '₹2,680 / Qtl', trend: '+₹30', APMC: `${district} Grain Market` },
  ];

  const agriSchemes = [
    { name: 'PM-Kisan Samman Nidhi', benefit: '₹6,000 / year in 3 installments', applyUrl: 'https://pmkisan.gov.in' },
    { name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', benefit: 'Crop insurance coverage for Kharif & Rabi seasons', applyUrl: 'https://pmfby.gov.in' },
    { name: 'MahaDBT Farmer Machinery Subsidy', benefit: 'Up to 50% subsidy on tractors and farm equipment', applyUrl: 'https://mahadbt.maharashtra.gov.in' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-700 via-amber-600 to-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-2 border border-white/20">
          <MapPin className="w-3.5 h-3.5" /> APMC & Agri Advisory for {taluka}, {district} District
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Agriculture & APMC Mandi Market Portal</h1>
        <p className="text-yellow-100 text-sm mt-1 max-w-2xl">
          Daily APMC mandi crop prices, weather advisories for sowing & harvesting, and agricultural subsidies for farmers in {district}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandi Prices */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" /> APMC Mandi Market Rates ({district})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mandiPrices.map((m, idx) => (
              <div key={idx} className="p-4 bg-yellow-50/60 rounded-xl border border-yellow-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">{m.crop}</h4>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{m.APMC}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-800 text-sm">{m.price}</div>
                  <div className={`text-[10px] font-bold ${m.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Farmer Schemes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" /> Agricultural Schemes & Subsidies
          </h3>

          <div className="space-y-3">
            {agriSchemes.map((s, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <h4 className="font-bold text-slate-800 leading-tight">{s.name}</h4>
                <p className="text-[11px] text-slate-600">{s.benefit}</p>
                <a
                  href={s.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 font-bold hover:underline inline-flex items-center gap-1 text-[11px] pt-1"
                >
                  Apply Portal <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgriculturePage;
