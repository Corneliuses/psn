import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders its children', () => {
    render(<GlassCard>Panel body</GlassCard>);
    expect(screen.getByText('Panel body')).toBeInTheDocument();
  });

  it('forwards className and merges it with the base surface classes', () => {
    render(<GlassCard className="custom-class">Body</GlassCard>);
    const el = screen.getByText('Body');
    expect(el).toHaveClass('custom-class');
    expect(el.className).toContain('bg-surface-2');
  });

  it('applies the glow variant only when requested', () => {
    const { rerender } = render(<GlassCard>Body</GlassCard>);
    expect(screen.getByText('Body').className).not.toContain('shadow-glow');

    rerender(<GlassCard glow>Body</GlassCard>);
    expect(screen.getByText('Body').className).toContain('shadow-glow');
  });

  it('can render as a different element via `as`', () => {
    render(
      <ul>
        <GlassCard as="li">List row</GlassCard>
      </ul>,
    );
    const item = screen.getByRole('listitem');
    expect(item.tagName).toBe('LI');
    expect(item).toHaveTextContent('List row');
  });
});
