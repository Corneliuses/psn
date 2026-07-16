/*
 * A trophy tier marker: a metal-colored glyph plus its count, with an accessible
 * name that reads the tier aloud (e.g. "3 platinum trophies"). Consumers pass a
 * count from the `TrophyCounts` shape (src/psn/models.ts). The glyph itself is
 * decorative (`aria-hidden`); the whole badge exposes one image-role label.
 */

export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

const TIER_COLOR: Record<TrophyTier, string> = {
  bronze: 'text-trophy-bronze',
  silver: 'text-trophy-silver',
  gold: 'text-trophy-gold',
  platinum: 'text-trophy-platinum',
};

export interface TrophyBadgeProps {
  tier: TrophyTier;
  count: number;
}

export function TrophyBadge({ tier, count }: TrophyBadgeProps) {
  const label = `${count} ${tier} ${count === 1 ? 'trophy' : 'trophies'}`;

  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-1.5">
      {/* Decorative metal-colored disc; the badge's aria-label carries the meaning. */}
      <span aria-hidden="true" className={`text-lg leading-none ${TIER_COLOR[tier]}`}>
        ●
      </span>
      <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-foreground">
        {count}
      </span>
    </span>
  );
}
