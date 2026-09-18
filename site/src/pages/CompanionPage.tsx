import { Link, useParams } from 'react-router';
import { titleStats } from 'psn/stats';

import { companionBySlug } from '../companions';
import { CompanionMap } from '../components/CompanionMap';
import { GlassCard } from '../components/GlassCard';
import { GuideTable } from '../components/GuideTable';
import { LinkList, NoteList, QuickReference, VideoList } from '../components/CompanionModules';
import { TogetherStats, type TogetherStatsEntry } from '../components/TogetherStats';
import { accentForKey } from '../config/accents';
import { players } from '../config/players';
import { snapshotByKey } from '../data';
import { NotFoundPage } from './NotFoundPage';
import { TOGETHER_PATH } from '../routes';

/*
 * One title's companion app. Every module is optional and rendered only when the
 * content file has it, in a fixed order: our stats, quick reference, map,
 * guides, help sites, videos, notes. `shapeIndex` increments across whatever
 * rendered, so the △ ○ ✕ □ section accents stay in sequence no matter which
 * modules a title skips.
 *
 * An unknown slug renders the shared 404 rather than an empty page.
 */
export function CompanionPage() {
  const { slug } = useParams();
  const companion = companionBySlug(slug);

  if (!companion) return <NotFoundPage />;

  const entries: TogetherStatsEntry[] = players.map((player) => ({
    playerKey: player.key,
    displayName: player.displayName,
    accent: accentForKey(player.key),
    stats: (() => {
      const snapshot = snapshotByKey(player.key);
      return snapshot ? titleStats(snapshot, companion.psnTitleNames) : undefined;
    })(),
  }));

  // Section accents advance in render order across the modules this title has.
  let shapeIndex = 0;
  const nextShape = (): number => shapeIndex++;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <GlassCard glow className="mb-10 p-8 sm:p-10">
        <Link
          to={TOGETHER_PATH}
          className="text-sm font-semibold text-ps-blue-text transition-colors hover:text-foreground"
        >
          &larr; All companion apps
        </Link>
        <h1 className="mt-3 text-3xl font-bold leading-none text-foreground sm:text-display">
          {companion.name}
        </h1>
        <p className="mt-2 text-foreground-muted">{companion.blurb}</p>
      </GlassCard>

      <TogetherStats entries={entries} shapeIndex={nextShape()} />

      {companion.quickReference?.length ? (
        <QuickReference groups={companion.quickReference} shapeIndex={nextShape()} />
      ) : null}

      {companion.map ? <CompanionMap map={companion.map} shapeIndex={nextShape()} /> : null}

      {companion.guides?.map((guide) => (
        <GuideTable key={guide.title} guide={guide} shapeIndex={nextShape()} />
      ))}

      {companion.links?.length ? <LinkList links={companion.links} shapeIndex={nextShape()} /> : null}

      {companion.videos?.length ? <VideoList videos={companion.videos} shapeIndex={nextShape()} /> : null}

      {companion.notes?.length ? <NoteList notes={companion.notes} shapeIndex={nextShape()} /> : null}
    </main>
  );
}
