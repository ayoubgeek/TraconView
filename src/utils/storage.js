/**
 * @file storage.js
 * @description LocalStorage wrappers for persisting user credentials.
 */

const CREDENTIALS_KEY = 'traconview:credentials';

/**
 * Saves OpenSky credentials to localStorage.
 * @param {{clientId: string, clientSecret: string}} credentials 
 */
export function saveCredentials(credentials) {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

/**
 * Loads OpenSky credentials from localStorage.
 * @returns {{clientId: string, clientSecret: string} | null}
 */
export function loadCredentials() {
  try {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to read from localStorage:', e);
    return null;
  }
}

/**
 * Removes OpenSky credentials from localStorage.
 */
export function clearCredentials() {
  try {
    localStorage.removeItem(CREDENTIALS_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}
