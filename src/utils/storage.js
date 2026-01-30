const STORAGE_KEYS = {
  CLEARANCE_LEVEL: 'baron_clearance_level',
  SCANLINES_ENABLED: 'baron_scanlines',
  AUDIO_ENABLED: 'baron_audio',
  TAP_COUNT: 'baron_tap_count',
  HAS_SEEN_SPLASH: 'baron_seen_splash',
  TOP_SECRET_UNLOCKED: 'baron_top_secret',
  KONAMI_UNLOCKED: 'baron_konami'
};

export const storage = {
  getClearanceLevel: () => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.CLEARANCE_LEVEL) || '1', 10);
  },

  setClearanceLevel: (level) => {
    localStorage.setItem(STORAGE_KEYS.CLEARANCE_LEVEL, level.toString());
  },

  getScanlinesEnabled: () => {
    const value = localStorage.getItem(STORAGE_KEYS.SCANLINES_ENABLED);
    return value === null ? true : value === 'true';
  },

  setScanlinesEnabled: (enabled) => {
    localStorage.setItem(STORAGE_KEYS.SCANLINES_ENABLED, enabled.toString());
  },

  getAudioEnabled: () => {
    const value = localStorage.getItem(STORAGE_KEYS.AUDIO_ENABLED);
    return value === null ? true : value === 'true';
  },

  setAudioEnabled: (enabled) => {
    localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, enabled.toString());
  },

  getTapCount: () => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TAP_COUNT) || '0', 10);
  },

  incrementTapCount: () => {
    const current = storage.getTapCount();
    const newCount = current + 1;
    localStorage.setItem(STORAGE_KEYS.TAP_COUNT, newCount.toString());
    return newCount;
  },

  resetTapCount: () => {
    localStorage.setItem(STORAGE_KEYS.TAP_COUNT, '0');
  },

  getHasSeenSplash: () => {
    return localStorage.getItem(STORAGE_KEYS.HAS_SEEN_SPLASH) === 'true';
  },

  setHasSeenSplash: (seen) => {
    localStorage.setItem(STORAGE_KEYS.HAS_SEEN_SPLASH, seen.toString());
  },

  getTopSecretUnlocked: () => {
    return localStorage.getItem(STORAGE_KEYS.TOP_SECRET_UNLOCKED) === 'true';
  },

  setTopSecretUnlocked: (unlocked) => {
    localStorage.setItem(STORAGE_KEYS.TOP_SECRET_UNLOCKED, unlocked.toString());
  },

  getKonamiUnlocked: () => {
    return localStorage.getItem(STORAGE_KEYS.KONAMI_UNLOCKED) === 'true';
  },

  setKonamiUnlocked: (unlocked) => {
    localStorage.setItem(STORAGE_KEYS.KONAMI_UNLOCKED, unlocked.toString());
  },

  purgeAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

export default storage;
