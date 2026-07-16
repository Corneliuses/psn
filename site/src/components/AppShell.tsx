import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

import { players } from '../config/players';
import { COMPARE_PATH, playerPath } from '../routes';

interface NavItem {
  to: string;
  label: string;
  /** Match the path exactly (used for the home/root link). */
  end: boolean;
}

const navItems: NavItem[] = [
  ...players.map((player) => ({ to: playerPath(player.key), label: player.displayName, end: false })),
  { to: COMPARE_PATH, label: 'Compare', end: false },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base = 'rounded-pill px-3 py-1.5 text-sm font-semibold transition-colors';
  return isActive
    ? `${base} bg-surface-2 text-foreground shadow-glow-sm`
    : `${base} text-foreground-muted hover:text-foreground`;
}

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Persistent app shell: a sticky translucent header (wordmark + primary nav with
 * an active-route indicator) wrapping every routed page. Nav links are derived
 * from the configured players — never hardcoded.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-0/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <NavLink
            to="/"
            end
            className="text-lg font-bold tracking-tight text-foreground"
            aria-label="PSN Stats home"
          >
            PSN<span className="text-ps-blue"> Stats</span>
          </NavLink>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
