import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateRealmPage } from './CreateRealmPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { api } from '../../api/client';

const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  addQuest: vi.fn().mockResolvedValue('quest-1'),
  startEncounter: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/app/providers/RealtimeProvider', () => ({
  useRealmClient: () => mockClient,
}));

// Mock dependencies
vi.mock('../../api/client', () => ({
  api: {
    post: vi.fn(),
  }
}));

// Mock ResizeObserver for RealmBackground/Canvas
vi.stubGlobal('ResizeObserver', class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});

describe('CreateRealmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <CreateRealmPage />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('validates custom deck parsing (< 3 values)', async () => {
    renderComponent();

    // Select Custom Deck
    fireEvent.click(screen.getByText('CUSTOM'));

    // Input invalid values
    const input = screen.getByPlaceholderText('0, 1, 2, 3, 5, 8, ?');
    fireEvent.change(input, { target: { value: '1, 2' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create realm/i }));

    await waitFor(() => {
      expect(screen.getByText('Must provide at least 3 unique values')).toBeInTheDocument();
    });
  });

  it('validates custom deck parsing (valid)', async () => {
    // Setup API mock for success
    (api.post as any).mockResolvedValueOnce({ code: 'ABCDE' }); // Create
    (api.post as any).mockResolvedValueOnce({ memberToken: 'token123', memberId: 'mem1' }); // Join

    renderComponent();

    // Fill Display Name
    fireEvent.change(screen.getByPlaceholderText('e.g. Archmage Aethelgard'), { target: { value: 'Merlin' } });

    // Select Custom Deck & Input Valid
    fireEvent.click(screen.getByText('CUSTOM'));
    const input = screen.getByPlaceholderText('0, 1, 2, 3, 5, 8, ?');
    fireEvent.change(input, { target: { value: '1, 2, 3' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create realm/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('realms', expect.objectContaining({
        settings: expect.objectContaining({
          customDeckValues: ['1', '2', '3', '?']
        })
      }));
      expect(mockClient.connect).toHaveBeenCalled();
    });
  });

  it('disables submit button while loading', async () => {
    // Setup API mock to hang or take time
    let resolveApi: (val: any) => void;
    const apiPromise = new Promise(resolve => { resolveApi = resolve; });
    (api.post as any).mockReturnValue(apiPromise);

    renderComponent();

    // Fill required
    fireEvent.change(screen.getByPlaceholderText('e.g. Archmage Aethelgard'), { target: { value: 'TestUser' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /create realm/i });
    fireEvent.click(submitBtn);

    // Check disabled/loading state
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText('Summoning...')).toBeInTheDocument();
    });

    // Resolve
    resolveApi!({ code: 'DONE' });
  });
});
