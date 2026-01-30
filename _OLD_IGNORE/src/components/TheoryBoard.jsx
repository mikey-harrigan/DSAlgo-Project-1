import { useMemo } from 'react';

const CONSPIRACY_WORDS = [
  'BARRON', 'TIMELINE', 'MIRROR', 'CONVERGENCE', '1889', 'LOCKWOOD',
  '66', 'SIGNAL', 'ARCHIVE', 'CLEARANCE', 'SVALBARD', 'FREQUENCY',
  'SHADOW', 'VATICAN', 'CHESS', 'PROTOCOL', '17', 'ELEVATOR',
  'BLUETOOTH', 'BEES', 'ORION', 'TRACK 117', 'FIRMWARE', 'VOICEPRINT',
  'THE BOY', 'AWAITING', 'PALM BEACH', 'NANNY', 'DENTAL', 'GROWTH'
];

function TheoryBoard({ onClose }) {
  // Generate random positions for words
  const wordPositions = useMemo(() => {
    return CONSPIRACY_WORDS.map((word, index) => ({
      word,
      x: 10 + (index % 5) * 18 + Math.random() * 10,
      y: 10 + Math.floor(index / 5) * 16 + Math.random() * 8,
      rotation: -15 + Math.random() * 30
    }));
  }, []);

  // Generate random string connections
  const connections = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 15; i++) {
      const from = Math.floor(Math.random() * CONSPIRACY_WORDS.length);
      let to = Math.floor(Math.random() * CONSPIRACY_WORDS.length);
      while (to === from) {
        to = Math.floor(Math.random() * CONSPIRACY_WORDS.length);
      }
      lines.push({ from, to });
    }
    return lines;
  }, []);

  return (
    <div className="fixed inset-0 bg-ops-black/95 z-50 overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-ops-cyan hover:text-white
                   text-2xl font-bold transition-colors"
      >
        ✕
      </button>

      {/* Header */}
      <div className="absolute top-4 left-4 z-50">
        <h2 className="text-ops-red font-display text-lg font-bold">
          🔴 CLASSIFIED THEORY BOARD
        </h2>
        <p className="text-gray-500 text-xs mt-1">
          Two-finger swipe to exit
        </p>
      </div>

      {/* Cork board background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-ops-dark to-amber-900/10" />

      {/* SVG for string connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map((conn, index) => {
          const from = wordPositions[conn.from];
          const to = wordPositions[conn.to];
          return (
            <line
              key={index}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke="#ff3333"
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}
      </svg>

      {/* Words/Notes */}
      {wordPositions.map((item, index) => (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`
          }}
        >
          <div className={`
            px-3 py-2 text-xs font-mono font-bold
            ${index % 3 === 0 ? 'bg-yellow-200 text-black' : ''}
            ${index % 3 === 1 ? 'bg-ops-dark border border-ops-cyan text-ops-cyan' : ''}
            ${index % 3 === 2 ? 'bg-red-900/50 border border-red-500 text-red-400' : ''}
            shadow-lg
          `}>
            {item.word}
          </div>
          {/* Pin */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
        </div>
      ))}

      {/* Central question */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-ops-black/80 border-2 border-ops-cyan p-6 text-center">
          <p className="text-ops-cyan text-xl font-bold font-display">
            WHO IS HE REALLY?
          </p>
          <p className="text-gray-500 text-xs mt-2">
            CONNECT THE DOTS
          </p>
        </div>
      </div>

      {/* Random photos/evidence markers */}
      <div className="absolute bottom-20 left-10 bg-ops-dark border border-gray-600 p-2">
        <div className="w-16 h-20 bg-gray-700 flex items-center justify-center text-2xl">
          👤
        </div>
        <p className="text-gray-500 text-xs mt-1 text-center">SUBJECT</p>
      </div>

      <div className="absolute top-40 right-20 bg-ops-dark border border-gray-600 p-2">
        <div className="w-16 h-16 bg-gray-700 flex items-center justify-center text-2xl">
          📖
        </div>
        <p className="text-gray-500 text-xs mt-1 text-center">1889</p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-gray-600 text-xs">
          "There are no coincidences. Only patterns we haven't recognized yet."
        </p>
      </div>
    </div>
  );
}

export default TheoryBoard;
