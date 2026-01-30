import { useState } from 'react';
import { getStatusColor } from '../data/sightings';

function SightingCard({ sighting, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="dossier-card rounded-lg p-4 cursor-pointer transition-all duration-200"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-gray-400 text-xs">{timestamp}</span>
        </div>
        <span className={`text-xs px-2 py-1 border rounded ${getStatusColor(sighting.status)}`}>
          {sighting.status}
        </span>
      </div>

      {/* Location */}
      <h3 className="text-white font-bold mb-1 text-sm">
        📍 {sighting.location}
      </h3>

      {/* Summary / Content */}
      {isExpanded ? (
        <div className="mt-3">
          <p className="text-gray-300 text-sm leading-relaxed">
            {sighting.content}
          </p>
          <div className="mt-3 pt-3 border-t border-ops-gray">
            <span className="text-gray-500 text-xs">{sighting.id}</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-xs mt-1">
          {sighting.summary}
        </p>
      )}

      {/* Expand indicator */}
      <div className="mt-2 text-right">
        <span className="text-ops-cyan text-xs">
          {isExpanded ? '[ COLLAPSE ]' : '[ VIEW FULL REPORT ]'}
        </span>
      </div>
    </div>
  );
}

export default SightingCard;
