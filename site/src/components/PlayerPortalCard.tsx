import type { PlayerTotals } from 'psn/stats';
import { Link } from 'react-router';

import { accentForKey } from '../config/accents';
import type { PlayerConfig } from '../config/players';
import { playerPath } from '../routes';
import { GlassCard } from './GlassCard';
import { TrophyBadge } from './TrophyBadge';

/*
 * A player's portal on the splash page: one big glass card per family member
 * that links to their stats page. It is tinted with the player's shape accent
 * (hairline, backdrop glyph, hover wash — all decorative), leads with their
 * name, and shows their four trophy-tier counts so the front door already says
 * something about each player. Without a synced snapshot it still renders the
 * portal, with a "no stats yet" line in place of the badges.
 *
 * The whole card is the link; its accessible name is its text content, so it
 * reads "<name> … Explore <name>'s trophies & playtime" plus the badge labels.
 */

const TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const;

export interface PlayerPortalCardProps {
  player: PlayerConfig;
  /** Totals from `playerTotals()` (only `trophies` is shown); omit when the player has no snapshot yet. */
  totals?: PlayerTotals;
}

export function PlayerPortalCard({ player, totals }: PlayerPortalCardProps) {
  const accent = accentForKey(player.key);

  return (
    <GlassCard
      as={Link}
      to={playerPath(player.key)}
      glow
      className="group relative flex h-full flex-col items-center gap-5 overflow-hidden p-7 text-center no-underline sm:p-8"
    >
      {/* Accent hairline along the top edge — decorative, composed from the
          player's shape token via its CSS variable (no Tailwind gradient stop
          utility can take a per-player token at runtime). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent.colorVar}, transparent)` }}
      />
      {/* Accent wash that blooms in on hover, behind the content. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${accent.colorVar} 18%, transparent), transparent 70%)` }}
      />
      {/* Oversized faded glyph in the corner. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-4 -top-6 select-none font-bold leading-none opacity-10 transition-transform group-hover:scale-110 ${accent.text}`}
        style={{ fontSize: '9rem' }}
      >
        {accent.glyph}
      </span>

      {/* Name block: a glyph chip over the name. */}
      <span className="relative flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-12 w-12 items-center justify-center rounded-lg bg-surface-3 text-2xl leading-none shadow-panel ${accent.text}`}
        >
          {accent.glyph}
        </span>
        <span className="text-3xl font-extrabold leading-none tracking-tight text-foreground">
          {player.displayName}
        </span>
      </span>

      {totals ? (
        <>
          <span className="relative flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 border-y border-border-subtle py-4">
            {TIERS.map((tier) => (
              <TrophyBadge key={tier} tier={tier} count={totals.trophies[tier]} />
            ))}
          </span>
        </>
      ) : (
        <span className="relative border-y border-border-subtle py-4 text-sm text-foreground-muted">
          No stats synced yet
        </span>
      )}

      <span className="relative mt-auto inline-flex items-center gap-2 rounded-pill bg-ps-blue-fill px-5 py-2 text-sm font-bold text-foreground shadow-glow-sm transition-colors group-hover:bg-ps-blue-fill-hover">
        Explore {player.displayName}&rsquo;s trophies &amp; playtime
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </GlassCard>
  );
}
