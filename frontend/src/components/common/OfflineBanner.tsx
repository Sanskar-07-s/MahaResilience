import React from 'react';
import { useOffline } from '../../hooks/useOffline.ts';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-warning text-white py-3 px-4 z-[999] shadow-lg flex items-center justify-center gap-2 font-bold text-sm animate-bounce">
      <WifiOff className="w-5 h-5 animate-pulse" />
      <span>Offline Emergency Mode Active — Local Caches Loaded</span>
    </div>
  );
};
