import { motion } from 'motion/react';
import { formatMinutes } from 'psn/duration';
import type { RosterComparison, RosterMetric } from 'psn/stats';

import { accentForKey } from '../config/accents';
import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';
import { TriClashMeter } from './TriClashMeter';
import type { TriClashEntry } from './TriClashMeter';
import type { TrophyTier } from './TrophyBadge';

/*
 * The family-wide scoreboard on the compare hub: every roster metric as a
 * `TriClashMeter`, headline metrics first and the trophy tiers (tinted with the
 * reserved trophy-metal text colors) as their own group. Rows are selected by
 * metric *key*, like the pairwise `MetricScoreboard`/`TrophyTiers`, so a reorder
 * in the data layer can't misplace them. Everything comes from
 * `compareRoster()` — values and leaders are rendered as-is, never re-derived.
 */

/** Rounds first: AnimatedNumber feeds fractional mid-tween minutes through here. */
function formatPlaytime(minutes: number): string {
  return formatMinutes(Math.round(minutes));
}

const HEADLINE_KEYS = ['playtimeMinutes', 'gamesPlayed', 'trophiesTotal', 'sharedGames'] as const;

const TIER_BY_KEY: readonly [string, TrophyTier][] = [
  ['bronze', 'bronze'],
  ['silver', 'silver'],
  ['gold', 'gold'],
  ['platinums', 'platinum'],
];

type NameFor = (key: string) => string;

function entriesFor(metric: RosterMetric, nameFor: NameFor): TriClashEntry[] {
  return metric.values.map(({ playerKey, value }) => ({
    key: playerKey,
    name: nameFor(playerKey),
    value,
    accent: accentForKey(playerKey),
  }));
}

function MeterGroup({ title, shapeIndex, rows, nameFor }: {
  title: string;
  nameFor: NameFor;
  shapeIndex: number;
  rows: { metric: RosterMetric; tier?: TrophyTier }[];
}) {
  return (
    <section className="mb-10">
      <SectionHeader title={title} shapeIndex={shapeIndex} />
      <GlassCard className="p-5 sm:p-6">
        <motion.div className="flex flex-col gap-6" variants={staggerChildren} initial="hidden" animate="visible">
          {rows.map(({ metric, tier }) => (
            <motion.div key={metric.metric} variants={fadeRise}>
              <TriClashMeter
                label={metric.label}
                entries={entriesFor(metric, nameFor)}
                leaders={metric.leaders}
                {...(metric.metric === 'playtimeMinutes' ? { format: formatPlaytime } : {})}
                {...(tier ? { tier } : {})}
              />
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
    </section>
  );
}

function trophyLabel(n: number): string {
  return `${n} ${n === 1 ? 'trophy' : 'trophies'}`;
}

export interface FamilyScoreboardProps {
  roster: RosterComparison;
}

export function FamilyScoreboard({ roster }: FamilyScoreboardProps) {
  const names = new Map(roster.players.map((p) => [p.key, p.displayName]));
  const nameFor: NameFor = (key) => names.get(key) ?? key;
  const byKey = new Map(roster.metrics.map((m) => [m.metric, m]));
  const headline = HEADLINE_KEYS.flatMap((key) => {
    const metric = byKey.get(key);
    return metric ? [{ metric }] : [];
  });
  const tiers = TIER_BY_KEY.flatMap(([key, tier]) => {
    const metric = byKey.get(key);
    return metric ? [{ metric, tier }] : [];
  });

  return (
    <>
      <MeterGroup title="Family scoreboard" shapeIndex={0} rows={headline} nameFor={nameFor} />
      <MeterGroup title="Family trophy tiers" shapeIndex={1} rows={tiers} nameFor={nameFor} />

      <section className="mb-10">
        <SectionHeader title="Played by everyone" shapeIndex={2} />
        {roster.sharedGames.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-foreground-muted">No game has been played by everyone yet.</p>
          </GlassCard>
        ) : (
          <motion.ul
            aria-label="Played by everyone"
            className="grid list-none grid-cols-1 gap-3 p-0"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            {roster.sharedGames.map((game, i) => (
              // Keyed by position too: a PS4 + PS5 entry of one game keeps two
              // rows with the same name (compareRoster keeps them on purpose).
              <motion.li key={`${i}-${game.name}`} variants={fadeRise}>
                <GlassCard glow className="p-4">
                  <h3 className="mb-3 truncate font-semibold text-foreground">{game.name}</h3>
                  <dl
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${Math.max(1, game.players.length)}, minmax(0, 1fr))` }}
                  >
                    {game.players.map((side) => {
                      const accent = accentForKey(side.playerKey);
                      return (
                        <div key={side.playerKey} className="flex min-w-0 flex-col gap-0.5">
                          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                            <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: accent.colorVar }} />
                            {nameFor(side.playerKey)}
                          </dt>
                          <dd className="font-semibold tabular-nums text-foreground">{formatMinutes(side.playtimeMinutes)}</dd>
                          <dd className="text-sm tabular-nums text-foreground-muted">{trophyLabel(side.trophiesEarned)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </GlassCard>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>
    </>
  );
}
