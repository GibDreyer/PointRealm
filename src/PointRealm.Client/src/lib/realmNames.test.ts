import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateRandomDisplayName } from './realmNames';

describe('generateRandomDisplayName', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a two-part adventurer name', () => {
    const result = generateRandomDisplayName();
    expect(result.split(' ').length).toBe(2);
  });

  it('uses deterministic picks from Math.random', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0);
    randomSpy.mockReturnValueOnce(0);

    expect(generateRandomDisplayName()).toBe('Arcanist Lyra');
  });
});
