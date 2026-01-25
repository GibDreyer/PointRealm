import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../src/features/landing/LandingPage';
import { RootProvider } from '../src/app/providers/RootProvider';
import '@testing-library/jest-dom';

describe('LandingPage', () => {
  it('renders welcome message', () => {
    render(
      <RootProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </RootProvider>
    );
    expect(screen.getByText('PointRealm')).toBeInTheDocument();
    expect(screen.getByText('Co-op estimation, RPG style.')).toBeInTheDocument();
  });
});
