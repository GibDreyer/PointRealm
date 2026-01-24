import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RuneCard } from './RuneCard';

describe('RuneCard', () => {
  it('renders value correctly', () => {
    render(<RuneCard value="5" onSelect={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles click selection', () => {
    const onSelect = vi.fn();
    render(<RuneCard value="8" onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('8');
  });

  it('does not fire selection when disabled', () => {
    const onSelect = vi.fn();
    render(<RuneCard value="13" disabled onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('reflects selected state via aria-pressed', () => {
    render(<RuneCard value="?" selected onSelect={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('reflects unselected state via aria-pressed', () => {
    render(<RuneCard value="?" onSelect={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });
});
