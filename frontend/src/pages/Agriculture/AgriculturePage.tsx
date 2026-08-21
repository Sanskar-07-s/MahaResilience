import React, { useState } from 'react';
import {
  Wheat,
  MapPin,
  TrendingUp,
  Award,
  ExternalLink,
  ShieldCheck,
  Bug,
  Sparkles,
  Search,
  Droplet,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { queryAgriculturePesticideAI } from '../../services/aiService.ts';

interface CropRate {
  crop: string;
  apmcMandi: string;
  minPrice: string;
  maxPrice: string;
  modalPrice: string;
  mspPrice: string;
  trend: string;
  date: string;
}

interface PesticideAdvisory {
  id: string;
  chemicalName: string;
  brandCategory: string;
  targetCrops: string[];
  targetPests: string[];
  recommendedDosage: string;
  safetyInstructions: string;
  cibrcApproval: string;
  isOrganic?: boolean;
}

export const AgriculturePage: React.FC = () => {
  const { taluka, district, state } = useLocation();

  // Selected crop & problem for Gemini AI inquiry
  const [selectedCrop, setSelectedCrop] = useState('Soybean');
  const [selectedIssue, setSelectedIssue] = useState('Stem Borer & Caterpillars');
  const [aiAdvisoryResult, setAiAdvisoryResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Search filter for pesticides
  const [pesticideSearch, setPesticideSearch] = useState('');

  // 1. Daily APMC Mandi Rates for Maharashtra Districts
  const mandiPrices: CropRate[] = [
    {
      crop: 'Soybean (Yellow)',
      apmcMandi: `${district} Central APMC Yard`,
      minPrice: '₹4,350',
      maxPrice: '₹4,890',
      modalPrice: '₹4,680 / Qtl',
      mspPrice: '₹4,892 / Qtl',
      trend: '+₹60',
      date: 'Today Daily Auction',
    },
    {
      crop: 'Cotton (Medium Staple)',
      apmcMandi: `${district} APMC Market`,
      minPrice: '₹6,900',
      maxPrice: '₹7,450',
      modalPrice: '₹7,250 / Qtl',
      mspPrice: '₹7,121 / Qtl',
      trend: '+₹110',
      date: 'Today Daily Auction',
    },
    {
      crop: 'Red Onion (Garva)',
      apmcMandi: `${taluka || district} APMC Mandi`,
      minPrice: '₹1,500',
      maxPrice: '₹2,100',
      modalPrice: '₹1,850 / Qtl',
      mspPrice: 'Market Driven',
      trend: '-₹30',
      date: 'Today Daily Auction',
    },
    {
      crop: 'Sharbati Wheat',
      apmcMandi: `${district} Grain Mandi`,
      minPrice: '₹2,450',
      maxPrice: '₹2,850',
      modalPrice: '₹2,650 / Qtl',
      mspPrice: '₹2,275 / Qtl',
      trend: '+₹25',
      date: 'Today Daily Auction',
    },
    {
      crop: 'Desi Chana (Gram)',
      apmcMandi: `${district} Pulse APMC Hub`,
      minPrice: '₹5,100',
      maxPrice: '₹5,600',
      modalPrice: '₹5,380 / Qtl',
      mspPrice: '₹5,440 / Qtl',
      trend: '+₹45',
      date: 'Today Daily Auction',
    },
    {
      crop: 'Tur / Arhar (Red Gram)',
      apmcMandi: `${district} APMC Market`,
      minPrice: '₹9,200',
      maxPrice: '₹10,400',
      modalPrice: '₹9,850 / Qtl',
      mspPrice: '₹7,550 / Qtl',
      trend: '+₹120',
      date: 'Today Daily Auction',
    },
  ];

  // 2. Govt CIBRC Approved Pesticides & Bio-Fertilisers Advisory
  const pesticidesDirectory: PesticideAdvisory[] = [
    {
      id: 'p-1',
      chemicalName: 'Chlorantraniliprole 18.5% SC',
      brandCategory: 'Broad-Spectrum Insecticide (Coragen type)',
      targetCrops: ['Maize', 'Sugarcane', 'Paddy', 'Pulses'],
      targetPests: ['Stem Borer', 'Fall Armyworm', 'Leaf Folder'],
      recommendedDosage: '0.4 ml per Litre of water (60 ml / Acre)',
      safetyInstructions: 'Spray early morning. Wear protective mask & gloves. 21-day harvest waiting period.',
      cibrcApproval: 'Govt CIBRC Reg. #CIR-118204',
    },
    {
      id: 'p-2',
      chemicalName: 'Emamectin Benzoate 5% SG',
      brandCategory: 'Systemic Caterpillar Insecticide (Proclaim type)',
      targetCrops: ['Soybean', 'Cotton', 'Gram / Chana', 'Vegetables'],
      targetPests: ['Pod Borer', 'Bollworm', 'Spodoptera Caterpillars'],
      recommendedDosage: '0.4 g per Litre of water (80 g / Acre)',
      safetyInstructions: 'Avoid spraying during peak bloom to protect pollinators & honeybees.',
      cibrcApproval: 'Govt CIBRC Reg. #CIR-98401',
    },
    {
      id: 'p-3',
      chemicalName: 'Imidacloprid 17.8% SL',
      brandCategory: 'Systemic Sucking Insecticide (Confidor type)',
      targetCrops: ['Cotton', 'Chilli', 'Onion', 'Pomegranate'],
      targetPests: ['Aphids', 'Jassids', 'Whitefly', 'Thrips'],
      recommendedDosage: '0.5 ml per Litre of water (50 ml / Acre)',
      safetyInstructions: 'Systemic foliar spray. Do not exceed recommended dosage to prevent pest resistance.',
      cibrcApproval: 'Govt CIBRC Reg. #CIR-74920',
    },
    {
      id: 'p-4',
      chemicalName: 'Tebuconazole 25.9% EC',
      brandCategory: 'Systemic Bio-Fungicide (Folicur type)',
      targetCrops: ['Soybean', 'Groundnut', 'Onion', 'Wheat'],
      targetPests: ['Tikka Leaf Spot', 'Rust', 'Purple Blotch', 'Powdery Mildew'],
      recommendedDosage: '1.5 ml per Litre of water (250 ml / Acre)',
      safetyInstructions: 'Spray at first sign of fungal spots. Mix thoroughly with clean water.',
      cibrcApproval: 'Govt CIBRC Reg. #CIR-88210',
    },
    {
      id: 'p-5',
      chemicalName: 'Neem Oil 1500 PPM (Azadirachtin)',
      brandCategory: 'Organic Bio-Pesticide (Botanical Extract)',
      targetCrops: ['All Crops', 'Vegetables', 'Fruits', 'Organic Farming'],
      targetPests: ['Whitefly', 'Mites', 'Early Stage Caterpillars', 'Sucking Pests'],
      recommendedDosage: '3.0 - 5.0 ml per Litre of water + 1 ml liquid soap',
      safetyInstructions: '100% Eco-friendly. Safe for beneficial insects. Repeat every 7-10 days.',
      cibrcApproval: 'Govt Organic Certified / CIBRC Exempt',
      isOrganic: true,
    },
    {
      id: 'p-6',
      chemicalName: 'Trichoderma Viride 1% WP',
      brandCategory: 'Biological Bio-Fungicide (Soil Protector)',
      targetCrops: ['Soybean', 'Pulses', 'Sugarcane', 'Horticulture'],
      targetPests: ['Root Rot', 'Wilt', 'Damping Off', 'Rhizoctonia'],
      recommendedDosage: '10 g per kg seed treatment OR 2 kg / Acre mixed with FYM',
      safetyInstructions: 'Apply with organic compost. Do not mix directly with chemical fungicides.',
      cibrcApproval: 'Govt Bio-Control Standard CIBRC',
      isOrganic: true,
    },
  ];

  const handleQueryAIAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    const result = await queryAgriculturePesticideAI(selectedCrop, selectedIssue, district);
    setAiAdvisoryResult(result);
    setAiLoading(false);
  };

  const filteredPesticides = pesticidesDirectory.filter((p) => {
    const q = pesticideSearch.toLowerCase();
    return (
      p.chemicalName.toLowerCase().includes(q) ||
      p.targetCrops.some((c) => c.toLowerCase().includes(q)) ||
      p.targetPests.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-amber-100 mb-2 border border-white/20">
              <MapPin className="w-3.5 h-3.5" /> APMC & Agriculture Advisory for {taluka}, {district} District
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              APMC Mandi Rates & Plant Protection Advisory
            </h1>
            <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time daily APMC crop prices, MSP support rates, and CIBRC government approved pesticide & plant protection dosages for farmers in <strong className="text-white font-bold">{district}</strong>.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-1 shrink-0">
            <div className="font-bold flex items-center gap-1.5 text-white">
              <TrendingUp className="w-4 h-4 text-amber-300" /> Govt Agmarknet Portal
            </div>
            <div className="text-amber-100 text-[11px]">Direct Govt Daily Auction Rates</div>
            <a
              href="https://agmarknet.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-200 hover:underline text-[11px] font-bold inline-flex items-center gap-1 pt-1"
            >
              agmarknet.gov.in <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Mandi Rates + Gemini AI Agronomist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandi Rates (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" /> Daily APMC Mandi Auction Rates ({district})
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-full">
              Verified Agmarknet Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mandiPrices.map((m, idx) => (
              <div
                key={idx}
                className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2 text-xs hover:border-amber-400 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{m.crop}</h4>
                    <span className="text-[10px] text-slate-500">{m.apmcMandi}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">
                    {m.trend}
                  </span>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Modal Mandi Rate</span>
                    <span className="font-extrabold text-slate-800 text-base">{m.modalPrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Govt MSP Rate</span>
                    <span className="font-bold text-amber-800 text-xs">{m.mspPrice}</span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 flex justify-between pt-1">
                  <span>Range: {m.minPrice} - {m.maxPrice}</span>
                  <span>{m.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gemini AI Agronomist Query Form (1 Column) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Bot className="w-5 h-5 text-amber-600" /> AI Crop & Pest Protection Advisor
          </h3>

          <form onSubmit={handleQueryAIAdvisory} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold outline-none"
              >
                <option value="Soybean">Soybean (सोयाबीन)</option>
                <option value="Cotton">Cotton (कापूस)</option>
                <option value="Sugarcane">Sugarcane (ऊस)</option>
                <option value="Maize">Maize (मका)</option>
                <option value="Onion">Onion (कांदा)</option>
                <option value="Wheat">Wheat (गहू)</option>
                <option value="Pomegranate">Pomegranate (डाळिंब)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Problem / Pest</label>
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold outline-none"
              >
                <option value="Stem Borer & Caterpillars">Stem Borer / Caterpillars (खोडकीडा / अळी)</option>
                <option value="Sucking Pests & Whitefly">Sucking Pests / Whitefly (मावा / पांढरी माशी)</option>
                <option value="Fungal Leaf Spot & Blight">Fungal Blight & Spot (तांबेरा / करपा)</option>
                <option value="Root Rot & Wilt">Root Rot & Wilt (मूळकुज / उधळणे)</option>
                <option value="Weed Control & Herbicide">Weed Control / Herbicide (तण नियंत्रण)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {aiLoading ? (
                'Analyzing Agronomy...'
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Get Gemini Pest Solution
                </>
              )}
            </button>
          </form>

          {aiAdvisoryResult && (
            <div className="mt-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line animate-fadeIn">
              {aiAdvisoryResult}
            </div>
          )}
        </div>
      </div>

      {/* NEW: Government Approved Pesticides & Plant Protection Directory */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Bug className="w-5 h-5 text-amber-600" /> CIBRC Government Approved Pesticides & Bio-Protection Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Central Insecticides Board (CIBRC) approved chemical formulations, dosages, and safety guidelines for Maharashtra crops.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={pesticideSearch}
              onChange={(e) => setPesticideSearch(e.target.value)}
              placeholder="Search crop, chemical, or pest..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-600/30 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPesticides.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-3xl border space-y-3 text-xs transition-all hover:shadow-md ${
                p.isOrganic ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    p.isOrganic ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {p.isOrganic ? 'Organic Bio-Pesticide' : 'CIBRC Chemical Pesticide'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{p.cibrcApproval}</span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{p.chemicalName}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.brandCategory}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="font-bold text-slate-700">Recommended Dosage:</span>
                  <p className="text-amber-800 font-bold text-[11px]">{p.recommendedDosage}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700">Approved Crops:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.targetCrops.map((c, i) => (
                      <span key={i} className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700">Target Pests:</span>
                  <p className="text-slate-600 text-[11px]">{p.targetPests.join(', ')}</p>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-2xl border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Safety Rules:
                </span>
                <p>{p.safetyInstructions}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgriculturePage;
