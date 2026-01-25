import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@/components/backgrounds/FantasySky3D', () => ({
  FantasySky3D: () => null,
}));

// JSDOM lacks ResizeObserver and matchMedia by default.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as any;
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as any;
}
