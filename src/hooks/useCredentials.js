/**
 * @file useCredentials.js
 * @description Hook for managing OpenSky credentials from local storage.
 */

import { useState, useCallback } from 'react';
import { loadCredentials, saveCredentials, clearCredentials } from '../utils/storage';

export function useCredentials() {
  const [credentials, setCredentials] = useState(loadCredentials);

  const save = useCallback((creds) => {
    saveCredentials(creds);
    setCredentials(creds);
  }, []);

  const clear = useCallback(() => {
    clearCredentials();
    setCredentials(null);
  }, []);

  return { credentials, saveCredentials: save, clearCredentials: clear };
}
