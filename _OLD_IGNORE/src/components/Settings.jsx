import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

function Settings({ onBack }) {
  const [scanlinesEnabled, setScanlinesEnabled] = useState(storage.getScanlinesEnabled());
  const [audioEnabled, setAudioEnabled] = useState(storage.getAudioEnabled());
  const [clearanceLevel, setClearanceLevel] = useState(storage.getClearanceLevel());
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [theoryStatus, setTheoryStatus] = useState(null);

  useEffect(() => {
    // Check for updates
    setClearanceLevel(storage.getClearanceLevel());
  }, []);

  const handleScanlinesToggle = () => {
    const newValue = !scanlinesEnabled;
    setScanlinesEnabled(newValue);
    storage.setScanlinesEnabled(newValue);
    // Force re-render of app
    window.location.reload();
  };

  const handleAudioToggle = () => {
    const newValue = !audioEnabled;
    setAudioEnabled(newValue);
    storage.setAudioEnabled(newValue);
  };

  const handlePurge = () => {
    storage.purgeAll();
    window.location.reload();
  };

  const handleSubmitTheory = () => {
    setTheoryStatus('UNDER REVIEW');
    setTimeout(() => setTheoryStatus(null), 3000);
  };

  const getClearanceLabel = () => {
    switch (clearanceLevel) {
      case 1: return 'LEVEL 1 — BASIC';
      case 2: return 'LEVEL 2 — ENHANCED';
      case 3: return 'LEVEL 3 — BARON+';
      case 4: return 'LEVEL 4 — EYES ONLY';
      default: return 'UNKNOWN';
    }
  };

  const getClearanceColor = () => {
    switch (clearanceLevel) {
      case 1: return 'text-green-400';
      case 2: return 'text-yellow-400';
      case 3: return 'text-orange-400';
      case 4: return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-ops-black">
      {/* Header */}
      <header className="sticky top-0 bg-ops-black/95 backdrop-blur z-30 border-b border-ops-gray p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-ops-cyan hover:underline text-sm"
          >
            ← DASHBOARD
          </button>
          <h1 className="font-display text-lg text-white font-bold">SETTINGS</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Clearance Level */}
        <div className="bg-ops-dark border border-ops-gray rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs block mb-1">CLEARANCE LEVEL</span>
              <span className={`font-bold ${getClearanceColor()}`}>
                {getClearanceLabel()}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getClearanceColor().replace('text-', 'border-')}`}>
              <span className={`text-xl font-bold ${getClearanceColor()}`}>{clearanceLevel}</span>
            </div>
          </div>
          {clearanceLevel < 4 && (
            <p className="text-gray-500 text-xs mt-3">
              Higher clearance grants access to restricted intel.
            </p>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          {/* Scanlines Toggle */}
          <div className="bg-ops-dark border border-ops-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">SCANLINE EFFECTS</span>
                <span className="text-gray-500 text-xs">CRT-style visual overlay</span>
              </div>
              <button
                onClick={handleScanlinesToggle}
                className={`w-14 h-8 rounded-full transition-all duration-200 relative ${
                  scanlinesEnabled ? 'bg-ops-cyan' : 'bg-ops-gray'
                }`}
              >
                <span
                  className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all duration-200 ${
                    scanlinesEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Audio Toggle */}
          <div className="bg-ops-dark border border-ops-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">AUDIO ENABLED</span>
                <span className="text-gray-500 text-xs">Sound effects for discoveries</span>
              </div>
              <button
                onClick={handleAudioToggle}
                className={`w-14 h-8 rounded-full transition-all duration-200 relative ${
                  audioEnabled ? 'bg-ops-cyan' : 'bg-ops-gray'
                }`}
              >
                <span
                  className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-all duration-200 ${
                    audioEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Theory */}
        <div className="bg-ops-dark border border-ops-gray rounded-lg p-4">
          <span className="text-white font-bold block mb-2">SUBMIT THEORY</span>
          <p className="text-gray-500 text-xs mb-3">
            Have intel to share? Submit your findings for review.
          </p>
          <button
            onClick={handleSubmitTheory}
            className="w-full py-2 border border-ops-cyan text-ops-cyan rounded
                       hover:bg-ops-cyan hover:text-ops-black transition-all duration-200"
          >
            {theoryStatus || 'SUBMIT FOR REVIEW'}
          </button>
        </div>

        {/* Purge Data */}
        <div className="bg-ops-dark border border-red-500/30 rounded-lg p-4">
          <span className="text-red-400 font-bold block mb-2">⚠️ DANGER ZONE</span>
          <p className="text-gray-500 text-xs mb-3">
            Purge all local data including clearance level and preferences.
          </p>
          {showPurgeConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={handlePurge}
                className="flex-1 py-2 bg-red-500 text-white rounded font-bold
                           hover:bg-red-600 transition-all duration-200"
              >
                CONFIRM PURGE
              </button>
              <button
                onClick={() => setShowPurgeConfirm(false)}
                className="flex-1 py-2 border border-gray-500 text-gray-400 rounded
                           hover:border-gray-400 transition-all duration-200"
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPurgeConfirm(true)}
              className="w-full py-2 border border-red-500 text-red-400 rounded
                         hover:bg-red-500/10 transition-all duration-200"
            >
              PURGE LOCAL DATA
            </button>
          )}
        </div>

        {/* Version */}
        <div className="text-center py-4">
          <p className="text-gray-600 text-xs">
            BARON TRUMP FACTS™
          </p>
          <p className="text-gray-700 text-xs mt-1">
            v1.9.47-classified
          </p>
          <p className="text-gray-700 text-xs mt-2">
            "Miss a day = miss the truth."
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
