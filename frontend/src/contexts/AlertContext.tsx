import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DisasterAlert {
  title: string;
  description: string;
  publishedDate: string;
  severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
  category: string;
  state: string;
  officialLink: string;
}

interface AlertContextType {
  alerts: DisasterAlert[];
  activeCriticalAlert: DisasterAlert | null;
  dismissCriticalAlert: () => void;
  isLoading: boolean;
  triggerAlarmSound: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState<DisasterAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Play synthesized sirens using browser Web Audio API (zero external assets needed)
  const triggerAlarmSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play double chime alarm
      playTone(523.25, ctx.currentTime, 0.4); // C5
      playTone(659.25, ctx.currentTime + 0.2, 0.4); // E5
      playTone(783.99, ctx.currentTime + 0.4, 0.6); // G5
    } catch (e) {
      console.warn('Audio Context alarm block', e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?state=maharashtra');
      if (!response.ok) throw new Error('Response not ok');
      const data: DisasterAlert[] = await response.json();
      setAlerts(data);

      // Check for any active critical alerts
      const critical = data.find(item => item.severity === 'CRITICAL');
      if (critical) {
        // Only show banner if it is a new critical alert
        setActiveCriticalAlert(prev => {
          if (prev?.title !== critical.title) {
            triggerAlarmSound();
            return critical;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('[Alert Engine] Sync failed:', error);
      // Fallback local mock alerts if backend is down or offline
      setAlerts([
        {
          title: 'RED ALERT: Severe Flooding Warning for Pune-East (Offline Mock)',
          description: 'Mutha river discharge exceeded critical limits. Heavy rainfall expected in next 6 hours. Residents near river beds must evacuate immediately to safe shelters.',
          publishedDate: new Date().toISOString(),
          severity: 'CRITICAL',
          category: 'FLOOD',
          state: 'MAHARASHTRA',
          officialLink: 'https://sachet.ndma.gov.in',
        },
        {
          title: 'HEATWAVE WARNING: Nagpur District (Offline Mock)',
          description: 'Nagpur and adjacent vidarbha districts are experiencing peak temperatures up to 46°C. Keep hydrated and avoid direct sunlight.',
          publishedDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          severity: 'CRITICAL',
          category: 'HEATWAVE',
          state: 'MAHARASHTRA',
          officialLink: 'https://sachet.ndma.gov.in',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Poll every 5 minutes (300,000ms)
    const timer = setInterval(() => {
      fetchAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const dismissCriticalAlert = () => {
    setActiveCriticalAlert(null);
  };

  return (
    <AlertContext.Provider
      value={{
        alerts,
        activeCriticalAlert,
        dismissCriticalAlert,
        isLoading,
        triggerAlarmSound
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useDisasterAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useDisasterAlerts must be used inside AlertProvider');
  return context;
};
