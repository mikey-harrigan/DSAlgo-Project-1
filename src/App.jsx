import { useState, useEffect, useCallback, useRef } from 'react';
import SplashScreen from './components/SplashScreen';
import Dashboard from './components/Dashboard';
import Archive from './components/Archive';
import Transmit from './components/Transmit';
import Sightings from './components/Sightings';
import Settings from './components/Settings';
import TheoryBoard from './components/TheoryBoard';
import { useKonamiCode } from './hooks/useKonamiCode';
import { useShakeDetection } from './hooks/useShakeDetection';
import { useEasterEggs } from './hooks/useEasterEggs';
import { storage } from './utils/storage';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [showSplash, setShowSplash] = useState(!storage.getHasSeenSplash());
  const touchStartRef = useRef({ x: 0, y: 0, fingers: 0 });

  const easterEggs = useEasterEggs();

  // Konami code hook
  useKonamiCode(easterEggs.handleKonamiUnlock);

  // Shake detection hook
  useShakeDetection(easterEggs.handleShake);

  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    storage.setHasSeenSplash(true);
    setShowSplash(false);
    setCurrentScreen('dashboard');
  }, []);

  // Global tap handler for 66th tap easter egg
  const handleGlobalClick = useCallback(() => {
    easterEggs.handleGlobalTap();
  }, [easterEggs]);

  // Two-finger swipe detection
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        fingers: 2
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartRef.current.fingers === 2) {
      const endX = e.changedTouches[0].clientX;
      const deltaX = touchStartRef.current.x - endX;

      if (deltaX > 100) { // Swipe left
        easterEggs.handleTwoFingerSwipe();
      }
    }
    touchStartRef.current = { x: 0, y: 0, fingers: 0 };
  }, [easterEggs]);

  // Render squirrel rain
  const renderSquirrelRain = () => {
    if (!easterEggs.squirrelRain) return null;

    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <span
            key={i}
            className="squirrel-rain absolute"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            🐿️
          </span>
        ))}
      </div>
    );
  };

  // Render flash message
  const renderFlashMessage = () => {
    if (!easterEggs.flashMessage) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 pointer-events-none">
        <div className="glitch text-ops-cyan text-xl md:text-2xl font-bold text-center px-4 font-mono">
          {easterEggs.flashMessage}
        </div>
      </div>
    );
  };

  // Render current screen
  const renderScreen = () => {
    if (showSplash) {
      return <SplashScreen onComplete={handleSplashComplete} />;
    }

    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setCurrentScreen}
            onSquirrelTap={easterEggs.handleSquirrelTap}
            onLogoLongPress={easterEggs.handleLogoLongPress}
            protocol17={easterEggs.protocol17}
          />
        );
      case 'archive':
        return (
          <Archive
            onBack={() => setCurrentScreen('dashboard')}
            onMirrorTap={easterEggs.handleMirrorTap}
            onPullRefresh={easterEggs.handlePullRefresh}
            allRedacted={easterEggs.allRedacted}
            konamiUnlocked={easterEggs.konamiUnlocked}
          />
        );
      case 'transmit':
        return <Transmit onBack={() => setCurrentScreen('dashboard')} />;
      case 'sightings':
        return <Sightings onBack={() => setCurrentScreen('dashboard')} />;
      case 'settings':
        return <Settings onBack={() => setCurrentScreen('dashboard')} />;
      default:
        return <Dashboard onNavigate={setCurrentScreen} />;
    }
  };

  const containerClasses = [
    'min-h-screen',
    'bg-ops-black',
    'text-white',
    'font-mono',
    storage.getScanlinesEnabled() ? 'scanlines' : '',
    easterEggs.inverted ? 'inverted' : '',
    easterEggs.redAlert ? 'red-alert' : '',
    easterEggs.protocol17 ? 'protocol-17' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      onClick={handleGlobalClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Noise overlay */}
      <div className="noise fixed inset-0 pointer-events-none z-10" />

      {/* Main content */}
      <div className="relative z-20">
        {renderScreen()}
      </div>

      {/* Easter egg overlays */}
      {renderSquirrelRain()}
      {renderFlashMessage()}

      {/* Theory Board modal */}
      {easterEggs.theoryBoardVisible && (
        <TheoryBoard onClose={easterEggs.closeTheoryBoard} />
      )}
    </div>
  );
}

export default App;
