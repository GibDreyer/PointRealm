import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LandingPage } from './LandingPage';
import { MemoryRouter } from 'react-router-dom';
import { RootProvider } from '@/app/providers/RootProvider';
import '@testing-library/jest-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ResizeObserver for Framer Motion or Layout
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

window.matchMedia = window.matchMedia || ((query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}));

vi.mock('@/components/backgrounds/StarfieldBackground', () => ({
  StarfieldBackground: () => null,
}));

const renderPage = () =>
  render(
    <RootProvider>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </RootProvider>
  );

describe('LandingPage', () => {
  it('navigates to create realm page when "Create Realm" is clicked', () => {
    renderPage();

    const createBtn = screen.getByText(/Create Realm/i);
    fireEvent.click(createBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/create');
  });

  it('navigates to join realm page when "Join Realm" is clicked', () => {
    renderPage();

    const joinBtn = screen.getByText(/Join Realm/i);
    fireEvent.click(joinBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/join');
  });

  it('renders key content', () => {
    renderPage();
    
    expect(screen.getByText('PointRealm')).toBeInTheDocument();
    expect(screen.getByText('Co-op estimation, RPG style.')).toBeInTheDocument();
    expect(screen.getByText('Free, open source, self-host friendly.')).toBeInTheDocument();
  });
});
