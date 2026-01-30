import { useState, useEffect } from 'react';

const BOOT_LINES = [
  '> INITIALIZING BARON INTEL NETWORK...',
  '> CHECKING CLEARANCE LEVEL...',
  '> SCANNING FOR SURVEILLANCE...',
  '> ESTABLISHING SECURE CONNECTION...',
  '> WELCOME TO THE ARCHIVE.'
];

function SplashScreen({ onComplete }) {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [showEnter, setShowEnter] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);

    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    if (currentLine < BOOT_LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => [...prev, BOOT_LINES[currentLine]]);
        setCurrentLine(prev => prev + 1);
      }, 600 + Math.random() * 400);

      return () => clearTimeout(timer);
    } else {
      // All lines displayed, show enter prompt
      const timer = setTimeout(() => setShowEnter(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentLine]);

  return (
    <div className="min-h-screen bg-ops-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* CRT effect overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ops-cyan/5 to-transparent animate-scanline" />
      </div>

      {/* Terminal window */}
      <div className="w-full max-w-md bg-ops-dark border border-ops-cyan/30 rounded-lg p-6 shadow-2xl shadow-ops-cyan/10">
        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-ops-cyan/20">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-4 text-ops-cyan/50 text-xs">SECURE_TERMINAL_v1.9.47</span>
        </div>

        {/* Boot text */}
        <div className="space-y-2 min-h-[200px]">
          {displayedLines.map((line, index) => (
            <div
              key={index}
              className="text-ops-cyan font-mono text-sm animate-pulse"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {line}
            </div>
          ))}

          {/* Cursor */}
          {!showEnter && (
            <div className="text-ops-cyan terminal-cursor text-sm">
              {currentLine < BOOT_LINES.length ? '>' : ''}
            </div>
          )}
        </div>

        {/* Enter prompt */}
        {showEnter && (
          <button
            onClick={onComplete}
            className="mt-6 w-full py-4 border-2 border-ops-cyan text-ops-cyan font-bold
                       hover:bg-ops-cyan hover:text-ops-black transition-all duration-200
                       animate-pulse glow-pulse"
          >
            [ TAP TO ENTER ]
          </button>
        )}
      </div>

      {/* Skip button */}
      {showSkip && !showEnter && (
        <button
          onClick={onComplete}
          className="absolute bottom-8 right-8 text-ops-cyan/50 text-xs hover:text-ops-cyan transition-colors"
        >
          SKIP →
        </button>
      )}

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ops-cyan/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ops-cyan/50 to-transparent" />
    </div>
  );
}

export default SplashScreen;
