import { useState, useMemo, useRef, useCallback } from 'react';
import { dailyFacts, baronPlusFacts, topSecretFacts } from '../data/facts';
import FactCard from './FactCard';

const FILTERS = ['ALL', 'DAILY', 'BARON+', 'SIGHTINGS'];

function Archive({ onBack, onMirrorTap, onPullRefresh, allRedacted, konamiUnlocked }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef(null);
  const pullStartY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    if (scrollRef.current?.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (pullStartY.current > 0) {
      const pullEndY = e.changedTouches[0].clientY;
      const pullDistance = pullEndY - pullStartY.current;

      if (pullDistance > 100) {
        onPullRefresh?.();
      }
    }
    pullStartY.current = 0;
  }, [onPullRefresh]);

  const filteredFacts = useMemo(() => {
    let facts = [];

    switch (activeFilter) {
      case 'DAILY':
        facts = [...dailyFacts];
        break;
      case 'BARON+':
        facts = [...baronPlusFacts];
        break;
      case 'SIGHTINGS':
        // Return empty for now - sightings are on separate page
        facts = [];
        break;
      default:
        facts = [...dailyFacts, ...baronPlusFacts];
        if (konamiUnlocked) {
          facts = [...facts, ...topSecretFacts];
        }
    }

    // Add some random redacted cards
    const redactedCount = Math.floor(facts.length * 0.1);
    for (let i = 0; i < redactedCount; i++) {
      const randomIndex = Math.floor(Math.random() * facts.length);
      facts.splice(randomIndex, 0, { id: 'REDACTED', title: 'REDACTED', content: '', level: 0 });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      facts = facts.filter(fact =>
        fact.title.toLowerCase().includes(query) ||
        fact.content.toLowerCase().includes(query)
      );
    }

    return facts;
  }, [activeFilter, searchQuery, konamiUnlocked]);

  return (
    <div className="min-h-screen bg-ops-black">
      {/* Header */}
      <header className="sticky top-0 bg-ops-black/95 backdrop-blur z-30 border-b border-ops-gray">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-ops-cyan hover:underline text-sm"
            >
              ← DASHBOARD
            </button>
            <h1 className="font-display text-lg text-white font-bold">THE ARCHIVE</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="QUERY ARCHIVE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ops-dark border border-ops-gray rounded-lg px-4 py-3
                         text-white placeholder-gray-500 focus:border-ops-cyan focus:outline-none
                         font-mono text-sm"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all
                           ${activeFilter === filter
                             ? 'bg-ops-cyan text-ops-black'
                             : 'bg-ops-dark border border-ops-gray text-gray-400 hover:border-ops-cyan'
                           }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Facts List */}
      <div
        ref={scrollRef}
        className="p-4 space-y-4 pb-24"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{filteredFacts.length} RECORDS FOUND</span>
          {konamiUnlocked && (
            <span className="text-purple-400">🔓 LEVEL 4 ACCESS</span>
          )}
        </div>

        {filteredFacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">NO RECORDS MATCH QUERY</p>
            <p className="text-gray-600 text-sm mt-2">Try a different search term</p>
          </div>
        ) : (
          filteredFacts.map((fact, index) => (
            <FactCard
              key={`${fact.id}-${index}`}
              fact={fact}
              onMirrorTap={onMirrorTap}
              allRedacted={allRedacted}
            />
          ))
        )}

        {/* Pull to refresh hint */}
        <div className="text-center py-4 text-gray-600 text-xs">
          Pull down to refresh archive...
        </div>
      </div>
    </div>
  );
}

export default Archive;
