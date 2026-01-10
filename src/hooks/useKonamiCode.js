import { useState, useEffect, useCallback } from 'react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

export const useKonamiCode = (onUnlock) => {
  const [inputSequence, setInputSequence] = useState([]);

  const handleKeyDown = useCallback((event) => {
    const key = event.code;

    setInputSequence(prev => {
      const newSequence = [...prev, key].slice(-KONAMI_CODE.length);

      if (newSequence.length === KONAMI_CODE.length &&
          newSequence.every((k, i) => k === KONAMI_CODE[i])) {
        onUnlock();
        return [];
      }

      return newSequence;
    });
  }, [onUnlock]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return inputSequence;
};

export default useKonamiCode;
