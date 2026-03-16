/**
 * @file useTokenManager.js
 * @description Manages OAuth2 token lifecycle.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCredentials } from './useCredentials';
import { fetchToken } from '../core/opensky/client';
import { useConnectionStatus } from '../context/ConnectionContext';
import { TOKEN_REFRESH_THRESHOLD } from '../core/opensky/constants';

export function useTokenManager() {
  const { credentials } = useCredentials();
  const { updateStatus } = useConnectionStatus();
  const tokenRef = useRef(null);
  const timerRef = useRef(null);

  const fetchAndStoreToken = useCallback(async function fetcher(clientId, clientSecret) {
    const res = await fetchToken(clientId, clientSecret);
    if (res.ok) {
      tokenRef.current = res.accessToken;
      updateStatus({ authMode: 'authenticated' });
      
      const refreshDelay = res.expiresIn * 1000 * TOKEN_REFRESH_THRESHOLD;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fetcher(clientId, clientSecret);
      }, refreshDelay);
    } else {
      tokenRef.current = null;
      updateStatus({ authMode: 'anonymous' });
    }
  }, [updateStatus]);

  useEffect(() => {
    if (credentials?.clientId && credentials?.clientSecret) {
      fetchAndStoreToken(credentials.clientId, credentials.clientSecret);
    } else {
      tokenRef.current = null;
      updateStatus({ authMode: 'anonymous' });
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [credentials, fetchAndStoreToken, updateStatus]);

  const getToken = useCallback(() => {
    return tokenRef.current;
  }, []);

  return { getToken };
}
