// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import FilterPopover from '../../src/components/ui/FilterPopover';
import React from 'react';

afterEach(cleanup);

// Mock FilterChips since it's a child component
vi.mock('../../src/components/ui/FilterChips', () => ({
  default: () => <div data-testid="filter-chips-stub">FilterChips</div>
}));

describe('FilterPopover', () => {
  it('renders trigger button and obeys isOpen prop', () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();
    
    const { rerender } = render(
      <FilterPopover isOpen={false} onToggle={onToggle} onClose={onClose} activeCount={0} />
    );
    
    // Trigger button should be rendered
    const triggerBtn = screen.getByRole('button', { name: /filters/i });
    expect(triggerBtn).toBeDefined();

    // Body should not be visible
    expect(screen.queryByTestId('filter-popover-body')).toBeNull();

    // Click trigger -> expect onToggle
    fireEvent.click(triggerBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    // Rerender as open
    rerender(
      <FilterPopover isOpen={true} onToggle={onToggle} onClose={onClose} activeCount={3} />
    );

    // Body should now be visible
    const body = screen.getByTestId('filter-popover-body');
    expect(body).toBeDefined();
    
    // Should show active count badge
    expect(triggerBtn.textContent).toMatch(/3/);

    // Press Escape -> expect onClose
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    
    // Click outside -> expect onClose
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
