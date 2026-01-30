import { useState, useEffect, useCallback } from 'react';

const SHAKE_THRESHOLD = 15;
const SHAKE_TIMEOUT = 1000;

export const useShakeDetection = (onShake) => {
  const [lastShake, setLastShake] = useState(0);
  const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });

  const handleMotion = useCallback((event) => {
    const { accelerationIncludingGravity } = event;

    if (!accelerationIncludingGravity) return;

    const { x, y, z } = accelerationIncludingGravity;

    const deltaX = Math.abs(x - lastAcceleration.x);
    const deltaY = Math.abs(y - lastAcceleration.y);
    const deltaZ = Math.abs(z - lastAcceleration.z);

    if ((deltaX > SHAKE_THRESHOLD || deltaY > SHAKE_THRESHOLD || deltaZ > SHAKE_THRESHOLD)) {
      const now = Date.now();
      if (now - lastShake > SHAKE_TIMEOUT) {
        setLastShake(now);
        onShake();
      }
    }

    setLastAcceleration({ x, y, z });
  }, [lastAcceleration, lastShake, onShake]);

  useEffect(() => {
    if (typeof DeviceMotionEvent !== 'undefined') {
      // Request permission on iOS 13+
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // Permission needs to be requested on user gesture
        const requestPermission = async () => {
          try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
            }
          } catch (error) {
            console.log('DeviceMotion permission denied');
          }
        };

        // Store for later use
        window.requestMotionPermission = requestPermission;
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return null;
};

export default useShakeDetection;
