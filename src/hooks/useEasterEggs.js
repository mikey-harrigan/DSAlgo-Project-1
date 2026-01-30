import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

export const useEasterEggs = () => {
  const [squirrelRain, setSquirrelRain] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [redAlert, setRedAlert] = useState(false);
  const [declassified, setDeclassified] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [protocol17, setProtocol17] = useState(false);
  const [theoryBoardVisible, setTheoryBoardVisible] = useState(false);
  const [allRedacted, setAllRedacted] = useState(false);
  const [konamiUnlocked, setKonamiUnlocked] = useState(storage.getKonamiUnlocked());
  const [squirrelTaps, setSquirrelTaps] = useState(0);
  const [mirrorTaps, setMirrorTaps] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Check for 3:33 AM
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      if (hours === 3 && minutes >= 30 && minutes <= 36) {
        setRedAlert(true);
        setFlashMessage("You're awake. So is he. Check your mirrors.");
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for the 17th (Protocol 17)
  useEffect(() => {
    const day = new Date().getDate();
    if (day === 17) {
      setProtocol17(true);
    }
  }, []);

  // 66th tap counter
  const handleGlobalTap = useCallback(() => {
    const newCount = storage.incrementTapCount();

    if (newCount === 66) {
      setFlashMessage("The 66th floor sends its regards.");
      storage.resetTapCount();
      setTimeout(() => setFlashMessage(null), 3000);
    }
  }, []);

  // Squirrel button handler
  const handleSquirrelTap = useCallback(() => {
    setSquirrelTaps(prev => {
      const newCount = prev + 1;
      if (newCount >= 7) {
        setSquirrelRain(true);
        setTimeout(() => setSquirrelRain(false), 3000);
        return 0;
      }
      // Reset after 2 seconds of no taps
      setTimeout(() => setSquirrelTaps(0), 2000);
      return newCount;
    });
  }, []);

  // Mirror tap handler (for facts containing "mirror")
  const handleMirrorTap = useCallback(() => {
    setMirrorTaps(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        setInverted(true);
        setTimeout(() => setInverted(false), 5000);
        return 0;
      }
      setTimeout(() => setMirrorTaps(0), 2000);
      return newCount;
    });
  }, []);

  // Shake to declassify
  const handleShake = useCallback(() => {
    setDeclassified(true);
    setFlashMessage("TEMPORARY DECLASSIFICATION — 3 SECONDS");
    setTimeout(() => {
      setDeclassified(false);
      setFlashMessage(null);
    }, 3000);
  }, []);

  // Long press logo handler
  const handleLogoLongPress = useCallback(() => {
    setFlashMessage("HE KNOWS YOU'RE READING THIS.");
    setTimeout(() => setFlashMessage(null), 3000);
  }, []);

  // Pull to refresh handler (3x fast)
  const handlePullRefresh = useCallback(() => {
    const now = Date.now();

    if (now - lastRefreshTime < 1000) {
      setRefreshCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setAllRedacted(true);
          setTimeout(() => setAllRedacted(false), 10000);
          return 0;
        }
        return newCount;
      });
    } else {
      setRefreshCount(1);
    }

    setLastRefreshTime(now);
  }, [lastRefreshTime]);

  // Konami code handler
  const handleKonamiUnlock = useCallback(() => {
    setKonamiUnlocked(true);
    storage.setKonamiUnlocked(true);
    storage.setClearanceLevel(4);
    setFlashMessage("CLEARANCE UPGRADED TO LEVEL 4");
    setTimeout(() => setFlashMessage(null), 3000);
  }, []);

  // Two-finger swipe left handler
  const handleTwoFingerSwipe = useCallback(() => {
    setTheoryBoardVisible(true);
  }, []);

  const closeTheoryBoard = useCallback(() => {
    setTheoryBoardVisible(false);
  }, []);

  return {
    // States
    squirrelRain,
    inverted,
    redAlert,
    declassified,
    flashMessage,
    protocol17,
    theoryBoardVisible,
    allRedacted,
    konamiUnlocked,

    // Handlers
    handleGlobalTap,
    handleSquirrelTap,
    handleMirrorTap,
    handleShake,
    handleLogoLongPress,
    handlePullRefresh,
    handleKonamiUnlock,
    handleTwoFingerSwipe,
    closeTheoryBoard,
    setFlashMessage
  };
};

export default useEasterEggs;
