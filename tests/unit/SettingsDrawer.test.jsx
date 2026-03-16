/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import SettingsDrawer from '../../src/components/SettingsDrawer/SettingsDrawer';
import { useCredentials } from '../../src/hooks/useCredentials';

vi.mock('../../src/hooks/useCredentials', () => ({
  useCredentials: vi.fn()
}));

describe('SettingsDrawer', () => {
  const mockSave = vi.fn();
  const mockClear = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    useCredentials.mockReturnValue({
      credentials: null,
      saveCredentials: mockSave,
      clearCredentials: mockClear
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SettingsDrawer isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Settings')).toBeDefined();
    expect(screen.getByLabelText(/Client ID/i)).toBeDefined();
    expect(screen.getByLabelText(/Client Secret/i)).toBeDefined();
  });

  it('populates with existing credentials', () => {
    useCredentials.mockReturnValue({
      credentials: { clientId: 'my-id', clientSecret: 'my-secret' },
      saveCredentials: mockSave,
      clearCredentials: mockClear
    });
    render(<SettingsDrawer isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue('my-id')).toBeDefined();
    expect(screen.getByDisplayValue('my-secret')).toBeDefined();
  });

  it('calls saveCredentials on submit', () => {
    render(<SettingsDrawer isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.change(screen.getByLabelText(/Client ID/i), { target: { value: 'new-id' } });
    fireEvent.change(screen.getByLabelText(/Client Secret/i), { target: { value: 'new-key' } });
    fireEvent.click(screen.getByText('Save'));

    expect(mockSave).toHaveBeenCalledWith({ clientId: 'new-id', clientSecret: 'new-key' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls clearCredentials on clear button click', () => {
    useCredentials.mockReturnValue({
      credentials: { clientId: 'my-id', clientSecret: 'my-secret' },
      saveCredentials: mockSave,
      clearCredentials: mockClear
    });
    render(<SettingsDrawer isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Clear Setup'));
    expect(mockClear).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(screen.getByLabelText(/Client ID/i).value).toBe('');
    expect(screen.getByLabelText(/Client Secret/i).value).toBe('');
  });
});
