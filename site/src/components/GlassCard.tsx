import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/*
 * The shared elevated "glass" surface every card-like element composes: a
 * translucent surface layer over surface-0, a hairline border, panel radius and
 * shadow, and a subtle hover lift. The optional `glow` variant adds a PS-blue
 * glow on hover for accent/interactive cards.
 *
 * Polymorphic via `as` (defaults to a <div>) so it can nest inside semantic
 * wrappers — e.g. a <li> in GameSection — without disturbing their roles.
 */

const BASE_CLASS =
  'rounded-panel border border-border-subtle bg-surface-2 shadow-panel ' +
  'transition-transform hover:-translate-y-0.5';

const GLOW_CLASS = 'hover:border-border-strong hover:shadow-glow';

type GlassCardOwnProps<T extends ElementType> = {
  /** Element or component to render as. Defaults to `div`. */
  as?: T;
  /** Adds a PS-blue glow on hover for accent/interactive cards. */
  glow?: boolean;
  className?: string;
  children?: ReactNode;
};

export type GlassCardProps<T extends ElementType = 'div'> = GlassCardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof GlassCardOwnProps<T>>;

export function GlassCard<T extends ElementType = 'div'>({
  as,
  glow = false,
  className = '',
  children,
  ...rest
}: GlassCardProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  const classes = [BASE_CLASS, glow ? GLOW_CLASS : '', className].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
