import React from 'react';
import { Bus, MapPin, Search } from 'lucide-react';

const TransportPage: React.FC = () => {
  const routes = [
    { code: 'MUM-PUN-01', origin: 'Mumbai Swargate Terminal', dest: 'Pune Shivajinagar Bus Station', type: 'MSRTC Bus', freq: 'Every 30 Mins', status: 'ON TIME' },
    { code: 'MET-L1-02', origin: 'Versova Metro Station', dest: 'Ghatkopar Terminal', type: 'Mumbai Metro Line 1', freq: 'Every 4 Mins', status: 'ON TIME' },
    { code: 'EV-CHG-92', origin: 'Pune Station Parking Ground', dest: '2 EV Fast DC Chargers Active', type: 'EV Station', freq: 'Available', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Public Transport & EV Chargers</h1>
        <p className="text-slate-500 text-sm mt-1">
          Locate state bus stops, metro connections, rail hubs, and operational electric vehicle (EV) charging stations.
        </p>
      </div>

      <div className="space-y-4 max-w-4xl">
        {routes.map((route) => (
          <div key={route.code} className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-100 text-secondary px-2.5 py-0.5 rounded font-bold uppercase">
                  {route.type}
                </span>
                <span className="text-xs text-slate-400">Route code: {route.code}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5 pt-0.5">
                <Bus className="w-5 h-5 text-secondary" />
                {route.origin} → {route.dest}
              </h3>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Frequency</span>
              <span className="font-bold text-slate-700 text-sm">{route.freq}</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold block mt-1.5 w-fit sm:ml-auto">
                {route.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportPage;
