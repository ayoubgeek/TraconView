import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveCredentials, loadCredentials, clearCredentials } from '../../src/utils/storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('saveCredentials stores to traconview:credentials', () => {
    const creds = { clientId: 'a', clientSecret: 'b' };
    saveCredentials(creds);
    expect(localStorage.setItem).toHaveBeenCalledWith('traconview:credentials', JSON.stringify(creds));
  });

  it('loadCredentials returns stored object', () => {
    localStorage.getItem.mockReturnValue(JSON.stringify({ clientId: 'a', clientSecret: 'b' }));
    expect(loadCredentials()).toEqual({ clientId: 'a', clientSecret: 'b' });
  });

  it('loadCredentials returns null when empty', () => {
    localStorage.getItem.mockReturnValue(null);
    expect(loadCredentials()).toBeNull();
  });

  it('clearCredentials removes the key', () => {
    clearCredentials();
    expect(localStorage.removeItem).toHaveBeenCalledWith('traconview:credentials');
  });
});
