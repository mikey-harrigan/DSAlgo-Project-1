import { useState } from 'react';
import { getLevelLabel, getLevelClass } from '../data/facts';

function FactCard({ fact, onMirrorTap, allRedacted }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasMirror = fact.content.toLowerCase().includes('mirror');

  const handleContentClick = (e) => {
    if (hasMirror && e.target.textContent.toLowerCase().includes('mirror')) {
      onMirrorTap?.();
    }
  };

  const getPreview = (content) => {
    return content.length > 80 ? content.substring(0, 80) + '...' : content;
  };

  const renderContent = (content) => {
    if (allRedacted) {
      return '[CONTENT EXPUNGED]';
    }

    if (!hasMirror) {
      return content;
    }

    // Highlight "mirror" word for easter egg
    const parts = content.split(/(mirror)/gi);
    return parts.map((part, i) =>
      part.toLowerCase() === 'mirror' ? (
        <span
          key={i}
          className="text-ops-cyan cursor-pointer hover:underline"
          onClick={handleContentClick}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (fact.id === 'REDACTED') {
    return (
      <div className="dossier-card rounded-lg p-4 opacity-60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500 text-xs">EXPUNGED</span>
          <span className="text-xs px-2 py-1 border border-gray-500 text-gray-500 rounded">
            [CLASSIFIED]
          </span>
        </div>
        <div className="bg-gray-800 h-4 rounded mb-2 w-3/4" />
        <div className="bg-gray-800 h-4 rounded w-1/2" />
        <p className="text-gray-600 text-sm mt-3 text-center">
          [CONTENT EXPUNGED]
        </p>
      </div>
    );
  }

  return (
    <div
      className={`dossier-card rounded-lg p-4 cursor-pointer transition-all duration-200 ${
        isExpanded ? 'ring-2 ring-ops-cyan' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-ops-cyan/70 text-xs tracking-wider">
          {fact.tier || 'DAILY INTEL'}
        </span>
        <span className={`text-xs px-2 py-1 border rounded ${getLevelClass(fact.level)}`}>
          {getLevelLabel(fact.level)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-bold mb-2">"{fact.title}"</h3>

      {/* Content */}
      <div className="text-gray-300 text-sm leading-relaxed">
        {isExpanded ? (
          <div className="whitespace-pre-wrap">{renderContent(fact.content)}</div>
        ) : (
          <p>{allRedacted ? '[CONTENT EXPUNGED]' : getPreview(fact.content)}</p>
        )}
      </div>

      {/* Expand indicator */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-gray-600 text-xs">{fact.id}</span>
        <span className="text-ops-cyan text-xs">
          {isExpanded ? '[ COLLAPSE ]' : '[ TAP TO EXPAND ]'}
        </span>
      </div>

      {/* BARON+ footer */}
      {fact.tier === 'BARON+' && (
        <div className="mt-3 pt-3 border-t border-ops-cyan/20 text-center">
          <span className="text-ops-cyan text-xs">
            🧠 Interpret. Archive. Forget nothing. 🐿️
          </span>
        </div>
      )}

      {/* TOP SECRET footer */}
      {fact.tier === 'TOP SECRET' && (
        <div className="mt-3 pt-3 border-t border-purple-500/20 text-center">
          <span className="text-purple-400 text-xs">
            👁️ EYES ONLY — DO NOT DISTRIBUTE
          </span>
        </div>
      )}
    </div>
  );
}

export default FactCard;
