/**
 * @file useVisibilityPause.js
 * @description Listens to document.visibilitychange to pause fetch loop when tab is hidden.
 */

import { useState, useEffect } from 'react';
import { IDLE_PAUSE_MS } from '../core/opensky/constants';

export function useVisibilityPause() {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timerId = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        timerId = setTimeout(() => {
          setIsPaused(true);
        }, IDLE_PAUSE_MS);
      } else {
        if (timerId) clearTimeout(timerId);
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (document.visibilityState === 'hidden') {
      handleVisibilityChange();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isPaused;
}
