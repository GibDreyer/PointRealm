import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RuneCard } from '../features/realmPlay/components/RuneCard';
import { ThemeProvider } from '../theme/ThemeProvider';
import { ThemeModeProvider } from '../theme/ThemeModeProvider';

const renderWithThemeMode = (ui: ReactNode) =>
  render(
    <ThemeProvider>
      <ThemeModeProvider>{ui}</ThemeModeProvider>
    </ThemeProvider>
  );

describe('RuneCard', () => {
  it('renders value correctly', () => {
    renderWithThemeMode(<RuneCard value="5" onSelect={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles click selection', () => {
    const onSelect = vi.fn();
    renderWithThemeMode(<RuneCard value="8" onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('8');
  });

  it('does not fire selection when disabled', () => {
    const onSelect = vi.fn();
    renderWithThemeMode(<RuneCard value="13" disabled onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('reflects selected state via aria-pressed', () => {
    renderWithThemeMode(<RuneCard value="?" selected onSelect={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('reflects unselected state via aria-pressed', () => {
    renderWithThemeMode(<RuneCard value="?" onSelect={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });
});
