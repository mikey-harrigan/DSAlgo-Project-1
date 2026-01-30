import { useState, useEffect, useMemo } from 'react';
import { sightings, generateFakeTimestamp, getRandomSighting } from '../data/sightings';
import SightingCard from './SightingCard';

function Sightings({ onBack }) {
  const [liveSightings, setLiveSightings] = useState([]);
  const [newSightingFlash, setNewSightingFlash] = useState(false);

  // Initialize with all sightings plus timestamps
  const initialSightings = useMemo(() => {
    return sightings.map(s => ({
      ...s,
      timestamp: generateFakeTimestamp()
    }));
  }, []);

  useEffect(() => {
    setLiveSightings(initialSightings);
  }, [initialSightings]);

  // Add new sighting periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const randomSighting = getRandomSighting();
      const newSighting = {
        ...randomSighting,
        id: `LIVE_${Date.now()}`,
        timestamp: 'JUST NOW'
      };

      setNewSightingFlash(true);
      setTimeout(() => setNewSightingFlash(false), 1000);

      setLiveSightings(prev => [newSighting, ...prev.slice(0, 14)]);
    }, 30000 + Math.random() * 30000); // 30-60 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-ops-black">
      {/* Header */}
      <header className="sticky top-0 bg-ops-black/95 backdrop-blur z-30 border-b border-ops-gray p-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="text-ops-cyan hover:underline text-sm"
          >
            ← DASHBOARD
          </button>
          <h1 className="font-display text-lg text-white font-bold">SIGHTINGS</h1>
          <div className="w-20" />
        </div>

        {/* Live indicator */}
        <div className={`flex items-center justify-center gap-2 py-2 transition-all duration-300 ${
          newSightingFlash ? 'bg-red-500/20' : ''
        }`}>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-red-400 text-xs font-bold tracking-wider">
            LIVE FEED ACTIVE
          </span>
        </div>
      </header>

      {/* Map Background (Stylized) */}
      <div className="relative">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 100 60" className="w-full h-32">
            {/* Simplified world map lines */}
            <path
              d="M10,30 Q25,20 40,25 T70,20 T90,30"
              fill="none"
              stroke="#00f5ff"
              strokeWidth="0.5"
            />
            <path
              d="M15,35 Q30,40 50,35 T85,40"
              fill="none"
              stroke="#00f5ff"
              strokeWidth="0.3"
            />
            {/* Dots for sighting locations */}
            <circle cx="25" cy="25" r="1" fill="#ff3333" className="animate-ping" />
            <circle cx="50" cy="30" r="1" fill="#ff3333" className="animate-ping" style={{ animationDelay: '0.5s' }} />
            <circle cx="75" cy="22" r="1" fill="#ff3333" className="animate-ping" style={{ animationDelay: '1s' }} />
          </svg>
        </div>
      </div>

      {/* Sightings List */}
      <div className="p-4 space-y-4 pb-24">
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{liveSightings.length} ACTIVE REPORTS</span>
          <span className="text-green-400">MONITORING: GLOBAL</span>
        </div>

        {liveSightings.map((sighting, index) => (
          <SightingCard
            key={`${sighting.id}-${index}`}
            sighting={sighting}
            timestamp={sighting.timestamp}
          />
        ))}

        {/* Footer notice */}
        <div className="text-center py-4 text-gray-600 text-xs">
          <p>New sightings appear automatically.</p>
          <p className="mt-1">Submit reports: SIGHTING@archive</p>
        </div>
      </div>
    </div>
  );
}

export default Sightings;
