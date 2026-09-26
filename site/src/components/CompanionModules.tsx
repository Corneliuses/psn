import { motion } from 'motion/react';

import type {
  CompanionLink,
  CompanionNote,
  CompanionVideo,
  QuickReferenceGroup,
} from '../companions/types';
import { fadeRise, staggerChildren } from '../motion/presets';
import { GlassCard } from './GlassCard';
import { SectionHeader } from './SectionHeader';

/*
 * Quick-reference cards each take the next shape in △ ○ ✕ □ — a coloured top
 * edge and a decorative glyph — so a wall of cards reads as distinct panels.
 */
const CARD_ACCENTS = [
  { glyph: '△', text: 'text-shape-triangle', edge: 'border-t-shape-triangle' },
  { glyph: '○', text: 'text-shape-circle', edge: 'border-t-shape-circle' },
  { glyph: '✕', text: 'text-shape-cross', edge: 'border-t-shape-cross' },
  { glyph: '□', text: 'text-shape-square', edge: 'border-t-shape-square' },
] as const;

/*
 * The simple list-shaped companion modules: quick reference, links, videos and
 * our own notes. Each is a thin, content-driven section composed from the kit —
 * none of them owns layout or timing of its own beyond the shared stagger.
 *
 * The richer modules live in their own files: CompanionMap (interactive map),
 * GuideTable (sortable tables) and TogetherStats (snapshot-derived numbers).
 */

export interface QuickReferenceProps {
  groups: QuickReferenceGroup[];
  shapeIndex?: number;
}

/** The one-screen cheat sheet: grouped term/detail pairs as a definition list. */
export function QuickReference({ groups, shapeIndex = 0 }: QuickReferenceProps) {
  return (
    <section className="mb-10">
      <SectionHeader title="Quick reference" shapeIndex={shapeIndex} />
      <motion.div
        className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        {groups.map((group, index) => {
          const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]!;
          return (
            <motion.div key={group.title} variants={fadeRise}>
              <GlassCard className={`h-full border-t-2 p-5 ${accent.edge}`}>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                  <span aria-hidden="true" className={`text-base leading-none ${accent.text}`}>
                    {accent.glyph}
                  </span>
                  {group.title}
                </h3>
                <dl className="m-0 flex flex-col gap-3">
                  {group.items.map((item) => (
                    <div key={item.term}>
                      <dt className="font-semibold text-foreground">{item.term}</dt>
                      <dd className="m-0 text-sm text-foreground-muted">{item.detail}</dd>
                    </div>
                  ))}
                </dl>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

export interface LinkListProps {
  links: CompanionLink[];
  shapeIndex?: number;
}

/** One card per link — shared by the grouped and ungrouped renderings below. */
function LinkCards({ links }: { links: CompanionLink[] }) {
  return (
    <motion.ul
      className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      {links.map((link) => (
        <motion.li key={link.href} variants={fadeRise}>
          <GlassCard
            as="a"
            glow
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="block h-full p-4"
          >
            <span className="font-semibold text-foreground">{link.label}</span>
            {link.note ? <span className="mt-1 block text-sm text-foreground-muted">{link.note}</span> : null}
          </GlassCard>
        </motion.li>
      ))}
    </motion.ul>
  );
}

/** Links by group, in the order each group first appears; ungrouped links last. */
function byGroup(links: CompanionLink[]): [string, CompanionLink[]][] {
  const groups = new Map<string, CompanionLink[]>();
  for (const link of links) {
    const key = link.group ?? 'More';
    const existing = groups.get(key);
    if (existing) existing.push(link);
    else groups.set(key, [link]);
  }
  return [...groups];
}

/**
 * Curated outbound help sites, each with a line on why it is worth opening.
 * Once a title has more links than fit in one scan, content can file them under
 * group headings; a list with no groups renders as one flat grid.
 */
export function LinkList({ links, shapeIndex = 0 }: LinkListProps) {
  const grouped = links.some((link) => link.group);

  return (
    <section className="mb-10">
      <SectionHeader title="Help sites" shapeIndex={shapeIndex} />
      {grouped ? (
        byGroup(links).map(([group, groupLinks]) => (
          <div key={group} className="mb-6 last:mb-0">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
              {group}
            </h3>
            <LinkCards links={groupLinks} />
          </div>
        ))
      ) : (
        <LinkCards links={links} />
      )}
    </section>
  );
}

export interface VideoListProps {
  videos: CompanionVideo[];
  shapeIndex?: number;
}

/**
 * Embedded YouTube walkthroughs. Uses the privacy-friendly nocookie host and
 * lazy-loads each frame so a page of videos doesn't cost a page of requests.
 */
export function VideoList({ videos, shapeIndex = 0 }: VideoListProps) {
  return (
    <section className="mb-10">
      <SectionHeader title="Videos" shapeIndex={shapeIndex} />
      <motion.ul
        className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        {videos.map((video) => (
          <motion.li key={video.youtubeId} variants={fadeRise}>
            <GlassCard className="overflow-hidden">
              <div className="aspect-video w-full bg-surface-1">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                  title={video.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="size-full border-0"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{video.title}</h3>
                {video.note ? <p className="mt-1 text-sm text-foreground-muted">{video.note}</p> : null}
              </div>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

export interface NoteListProps {
  notes: CompanionNote[];
  shapeIndex?: number;
}

/** Our own notes — the part no wiki has: house rules, plans, reminders. */
export function NoteList({ notes, shapeIndex = 0 }: NoteListProps) {
  return (
    <section className="mb-10">
      <SectionHeader title="Our notes" shapeIndex={shapeIndex} />
      <motion.ul
        className="grid list-none grid-cols-1 gap-3 p-0"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        {notes.map((note) => (
          <motion.li key={note.title} variants={fadeRise}>
            <GlassCard className="p-5">
              <h3 className="font-semibold text-foreground">{note.title}</h3>
              <p className="mt-1 text-sm text-foreground-muted">{note.body}</p>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
