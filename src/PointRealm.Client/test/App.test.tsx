import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../src/features/landing/LandingPage';
import '@testing-library/jest-dom';

describe('LandingPage', () => {
  it('renders welcome message', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText('PointRealm')).toBeInTheDocument();
    expect(screen.getByText('Adventure awaits.')).toBeInTheDocument();
  });
});
