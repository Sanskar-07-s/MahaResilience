import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  createdAt: string;
}

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/emergency/alerts');
        if (response.ok) {
          setAlerts(await response.json());
        } else {
          // Static fallback alerts if db seeds not present
          setAlerts([
            { id: '1', title: 'Pune West Power Substation Maintenance Outage', description: 'Power grid operations will be suspended from 10 AM to 2 PM on Sunday for repairs.', type: 'OUTAGE', severity: 'WARNING', createdAt: new Date().toISOString() },
            { id: '2', title: 'Severe Heavy Rainfall Alert - Mumbai Harbor Coastline', description: 'Monsoon gusts and heavy rainfall expected along the Konkan belt. Citizens are advised to limit sea travel.', type: 'WEATHER', severity: 'CRITICAL', createdAt: new Date().toISOString() },
          ]);
        }
      } catch (err) {
        setAlerts([
          { id: '1', title: 'Pune West Power Substation Maintenance Outage', description: 'Power grid operations will be suspended from 10 AM to 2 PM on Sunday for repairs.', type: 'OUTAGE', severity: 'WARNING', createdAt: new Date().toISOString() },
          { id: '2', title: 'Severe Heavy Rainfall Alert - Mumbai Harbor Coastline', description: 'Monsoon gusts and heavy rainfall expected along the Konkan belt. Citizens are advised to limit sea travel.', type: 'WEATHER', severity: 'CRITICAL', createdAt: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Hyperlocal Real-Time Announcements</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review critical bulletins from municipal corporations regarding weather, traffic routing, water scheduling, and grid outages.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 rounded-md3 border flex items-start gap-4 ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-50 border-red-200'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className={`p-2.5 rounded-full ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-200 text-red-700'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-200 text-amber-700'
                  : 'bg-blue-200 text-blue-700'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-white border border-slate-border px-2 py-0.5 rounded font-semibold text-slate-600 uppercase">
                    {alert.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 pt-0.5">{alert.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
