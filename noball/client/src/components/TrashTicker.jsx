import React, { useState, useEffect } from 'react';

export default function TrashTicker({ lines, teamColor }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!lines || lines.length === 0) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % lines.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [lines]);

  if (!lines || lines.length === 0) return null;

  return (
    <div
      className="trash-ticker"
      style={{
        borderLeft: teamColor ? `3px solid ${teamColor}` : undefined,
        marginBottom: '16px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)',
        padding: '10px 16px',
      }}
    >
      &ldquo;{lines[index]}&rdquo;
    </div>
  );
}
