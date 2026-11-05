import { describe, expect, it } from 'vitest';

import { joinNames } from './format';

describe('joinNames', () => {
  it('returns an empty string for an empty roster', () => {
    expect(joinNames([])).toBe('');
  });

  it('returns a lone name unchanged', () => {
    expect(joinNames(['Dad'])).toBe('Dad');
  });

  it('joins two names with an ampersand', () => {
    expect(joinNames(['Dad', 'Braidan'])).toBe('Dad & Braidan');
  });

  it('comma-separates three or more names with an ampersand before the last', () => {
    expect(joinNames(['Dad', 'Braidan', 'Nadia'])).toBe('Dad, Braidan & Nadia');
    expect(joinNames(['A', 'B', 'C', 'D'])).toBe('A, B, C & D');
  });
});
