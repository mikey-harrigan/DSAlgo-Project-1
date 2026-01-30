import { useState, useEffect, useRef, useCallback } from 'react';
import { getRandomFact, getLevelLabel, getLevelClass } from '../data/facts';

const THREAT_LEVELS = [
  'ELEVATED',
  'CONCERNING',
  'ENIGMATIC',
  'WATCHING',
  'QUIET... TOO QUIET',
  'NOMINAL',
  'HEIGHTENED',
  'UNCERTAIN'
];

function Dashboard({ onNavigate, onSquirrelTap, onLogoLongPress, protocol17 }) {
  const [threatLevel, setThreatLevel] = useState(THREAT_LEVELS[0]);
  const [todaysFact, setTodaysFact] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const longPressTimer = useRef(null);

  useEffect(() => {
    // Set random threat level
    setThreatLevel(THREAT_LEVELS[Math.floor(Math.random() * THREAT_LEVELS.length)]);

    // Get today's fact
    setTodaysFact(getRandomFact());

    // Cycle threat level every 30 seconds
    const interval = setInterval(() => {
      setThreatLevel(THREAT_LEVELS[Math.floor(Math.random() * THREAT_LEVELS.length)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogoTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      onLogoLongPress?.();
    }, 2000);
  }, [onLogoLongPress]);

  const handleLogoTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'ELEVATED':
      case 'HEIGHTENED':
        return 'text-orange-400';
      case 'CONCERNING':
        return 'text-red-400';
      case 'ENIGMATIC':
      case 'UNCERTAIN':
        return 'text-purple-400';
      case 'WATCHING':
        return 'text-yellow-400';
      case 'QUIET... TOO QUIET':
        return 'text-green-400';
      default:
        return 'text-ops-cyan';
    }
  };

  return (
    <div className={`min-h-screen bg-ops-black p-4 pb-24 ${protocol17 ? 'protocol-17' : ''}`}>
      {/* Header */}
      <header className="text-center mb-6">
        <h1
          className="font-display text-2xl md:text-3xl text-ops-cyan font-bold tracking-wider cursor-pointer select-none"
          onTouchStart={handleLogoTouchStart}
          onTouchEnd={handleLogoTouchEnd}
          onMouseDown={handleLogoTouchStart}
          onMouseUp={handleLogoTouchEnd}
          onMouseLeave={handleLogoTouchEnd}
        >
          BARON TRUMP FACTS™
        </h1>
        <p className="text-ops-cyan/60 text-xs mt-1 tracking-widest">
          CLASSIFIED INTEL TERMINAL
        </p>
        {protocol17 && (
          <div className="mt-2 inline-block px-3 py-1 bg-ops-gold/20 border border-ops-gold text-ops-gold text-xs rounded">
            PROTOCOL 17 ACTIVE
          </div>
        )}
      </header>

      {/* Threat Level */}
      <div className="bg-ops-dark border border-ops-gray rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">CURRENT THREAT LEVEL</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${getThreatColor().replace('text-', 'bg-')}`} />
            <span className={`font-bold ${getThreatColor()}`}>{threatLevel}</span>
          </div>
        </div>
      </div>

      {/* Today's Fact */}
      {todaysFact && (
        <div className="dossier-card rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-ops-cyan text-xs tracking-wider">TODAY'S INTEL</span>
            <span className={`text-xs px-2 py-1 border rounded ${getLevelClass(todaysFact.level)}`}>
              {getLevelLabel(todaysFact.level)}
            </span>
          </div>

          <h3 className="text-white font-bold mb-2">"{todaysFact.title}"</h3>

          <p className={`text-gray-300 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
            {todaysFact.content}
          </p>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-ops-cyan text-xs mt-3 hover:underline"
          >
            {isExpanded ? '[ COLLAPSE ]' : '[ EXPAND DOSSIER ]'}
          </button>
        </div>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('archive')}
          className="bg-ops-dark border border-ops-cyan/30 rounded-lg p-4 text-left
                     hover:border-ops-cyan hover:bg-ops-gray transition-all duration-200
                     active:scale-95"
        >
          <span className="text-2xl mb-2 block">📁</span>
          <span className="text-white font-bold block">ARCHIVE</span>
          <span className="text-gray-500 text-xs">Full repository</span>
        </button>

        <button
          onClick={() => onNavigate('transmit')}
          className="bg-ops-dark border border-ops-cyan/30 rounded-lg p-4 text-left
                     hover:border-ops-cyan hover:bg-ops-gray transition-all duration-200
                     active:scale-95"
        >
          <span className="text-2xl mb-2 block">📡</span>
          <span className="text-white font-bold block">TRANSMIT</span>
          <span className="text-gray-500 text-xs">Send intel</span>
        </button>

        <button
          onClick={() => onNavigate('sightings')}
          className="bg-ops-dark border border-ops-cyan/30 rounded-lg p-4 text-left
                     hover:border-ops-cyan hover:bg-ops-gray transition-all duration-200
                     active:scale-95"
        >
          <span className="text-2xl mb-2 block">🔍</span>
          <span className="text-white font-bold block">SIGHTINGS</span>
          <span className="text-gray-500 text-xs">Live tracker</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className="bg-ops-dark border border-ops-cyan/30 rounded-lg p-4 text-left
                     hover:border-ops-cyan hover:bg-ops-gray transition-all duration-200
                     active:scale-95"
        >
          <span className="text-2xl mb-2 block">⚙️</span>
          <span className="text-white font-bold block">SETTINGS</span>
          <span className="text-gray-500 text-xs">Configure</span>
        </button>
      </div>

      {/* Squirrel Easter Egg Button */}
      <button
        onClick={onSquirrelTap}
        className="fixed bottom-4 right-4 w-12 h-12 flex items-center justify-center
                   bg-ops-dark border border-ops-gray rounded-full
                   hover:border-ops-cyan transition-all duration-200
                   active:scale-90"
      >
        <span className="text-xl">🐿️</span>
      </button>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-ops-black/80 backdrop-blur border-t border-ops-gray p-2 text-center">
        <span className="text-gray-600 text-xs">
          SECURE CONNECTION ESTABLISHED • v1.9.47-classified
        </span>
      </footer>
    </div>
  );
}

export default Dashboard;
