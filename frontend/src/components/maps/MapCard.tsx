import React from 'react';
import { Navigation, Phone, Share2, Star, X } from 'lucide-react';

interface MapCardProps {
  title: string;
  address: string;
  phone?: string;
  details?: string;
  rating?: number;
  onClose: () => void;
}

export const MapCard: React.FC<MapCardProps> = ({
  title,
  address,
  phone,
  details,
  rating = 4.5,
  onClose,
}) => {
  const handleDirections = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + ' ' + address)}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, text: address, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${title} - ${address}`);
      alert('Location details copied to clipboard!');
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white p-5 rounded-md3 shadow-md3-elevation-2 border border-slate-border z-40 space-y-3 animate-slide-up">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-slate-800 text-sm leading-tight pr-4">{title}</h4>
        <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-500">{address}</p>
      {details && <p className="text-[11px] bg-slate-50 p-2 rounded text-slate-600 leading-normal">{details}</p>}

      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
        <Star className="w-3.5 h-3.5 fill-current" />
        <span>{rating.toFixed(1)}</span>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleDirections}
          className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-md3 text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          Route
        </button>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="p-2 border border-slate-border text-slate-600 hover:bg-slate-50 rounded-md3 flex items-center justify-center"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        <button
          onClick={handleShare}
          className="p-2 border border-slate-border text-slate-600 hover:bg-slate-50 rounded-md3 flex items-center justify-center"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
