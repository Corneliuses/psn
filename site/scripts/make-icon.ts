/**
 * Generates the app icon set under `site/public/` — the favicon, the PWA
 * manifest icons and the iOS home-screen icon — from one SVG drawn here.
 *
 * The mark is "PlayStation corn": a corn cob (the Cornelius family pun) whose
 * kernels are the four abstract shape glyphs (△ ○ ✕ □) in the shape token
 * colors, wrapped in PS-blue husk leaves, on the surface-0 tile. It composes the
 * site's own design tokens — every color is read from `theme.css` rather than
 * typed here, so a token change re-skins the icon — and uses no Sony assets,
 * the same rule as the rest of the site.
 *
 * Run `pnpm --filter site icons` after editing and commit the output; the files
 * in `public/` are the source of truth the site ships, this script only
 * regenerates them. Rasters are rendered with the site's Playwright Chromium
 * (set `CHROMIUM_PATH` to use another binary).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');
const themeCss = readFileSync(join(here, '..', 'src', 'styles', 'theme.css'), 'utf8');

/** Read one `--name: value;` token out of the theme's `@theme` block. */
function token(name: string): string {
  const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(themeCss)?.[1]?.trim();
  if (!value) throw new Error(`theme.css has no --${name} token`);
  return value;
}

const color = {
  surface0: token('color-surface-0'),
  foreground: token('color-foreground'),
  psBlue: token('color-ps-blue'),
  psBlueHover: token('color-ps-blue-hover'),
  psBlueFill: token('color-ps-blue-fill'),
  shapes: [
    token('color-shape-triangle'),
    token('color-shape-circle'),
    token('color-shape-cross'),
    token('color-shape-square'),
  ],
};

const SIZE = 512;

/** The cob outline, in the untilted art space (512×512, cob centred on x=256). */
const COB =
  'M256 50 C318 50 366 160 366 300 C366 410 330 470 256 470 C182 470 146 410 146 300 C146 160 194 50 256 50 Z';
/** Two husk leaves wrapping the lower cob, peeled back to a tip either side. */
const LEFT_LEAF =
  'M256 486 C150 486 118 400 128 300 C126 250 100 200 70 150 C150 220 215 290 240 370 C252 410 256 440 256 486 Z';
const RIGHT_LEAF =
  'M256 486 C362 486 394 400 384 300 C386 250 412 210 442 180 C362 240 297 290 272 370 C260 410 256 440 256 486 Z';
const LEFT_VEIN = 'M244 470 C180 420 150 330 110 210';
const RIGHT_VEIN = 'M268 470 C332 420 362 330 400 230';

/** One shape glyph (△ ○ ✕ □ by index) outlined on a kernel, centred on (cx, cy). */
function glyph(kind: number, cx: number, cy: number, r: number): string {
  const style = `fill="none" stroke="${color.surface0}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" opacity="0.55"`;
  switch (kind) {
    case 0:
      return `<polygon points="${cx},${cy - r} ${cx + r * 0.95},${cy + r * 0.75} ${cx - r * 0.95},${cy + r * 0.75}" ${style}/>`;
    case 1:
      return `<circle cx="${cx}" cy="${cy}" r="${r * 0.9}" ${style}/>`;
    case 2:
      return `<path d="M${cx - r * 0.8},${cy - r * 0.8} L${cx + r * 0.8},${cy + r * 0.8} M${cx + r * 0.8},${cy - r * 0.8} L${cx - r * 0.8},${cy + r * 0.8}" ${style}/>`;
    default:
      return `<rect x="${cx - r * 0.78}" y="${cy - r * 0.78}" width="${r * 1.56}" height="${r * 1.56}" rx="2" ${style}/>`;
  }
}

/**
 * Rough half-width of the cob at a given y (an ellipse fitted to COB), used only
 * to skip kernels that the clip path would discard entirely.
 */
function cobHalfWidth(y: number): number {
  const t = y < 300 ? (300 - y) / 250 : (y - 300) / 170;
  return t >= 1 ? 0 : 110 * Math.sqrt(1 - t * t);
}

/** A staggered grid of kernels, each a rounded square in one shape color with its glyph. */
function kernels(): string {
  const cell = 44;
  const pitch = cell + 8;
  const out: string[] = [];
  let row = 0;
  for (let y = 72; y < 480; y += pitch, row++) {
    const offset = row % 2 ? pitch / 2 : 0;
    for (let col = -4; col <= 4; col++) {
      const cx = 256 + col * pitch + offset;
      if (Math.abs(cx - 256) > cobHalfWidth(y) + cell / 2) continue;
      const kind = (row * 3 + col * 5 + 400) % 4;
      out.push(
        `<rect x="${cx - cell / 2}" y="${y - cell / 2}" width="${cell}" height="${cell}" rx="11" fill="${color.shapes[kind]}"/>`,
        glyph(kind, cx, y, 11),
      );
    }
  }
  return out.join('');
}

interface IconOptions {
  /** How much of the tile the art fills — smaller for masked icons (safe zone). */
  artScale: number;
  /** Tile corner radius; 0 for icons the OS masks itself (iOS, maskable). */
  cornerRadius: number;
}

function renderSvg({ artScale, cornerRadius }: IconOptions): string {
  const vein = (d: string): string =>
    `<path d="${d}" fill="none" stroke="${color.psBlueHover}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`;
  const outline = `stroke="${color.surface0}" stroke-width="6" stroke-linejoin="round"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.62" r="0.6">
      <stop offset="0" stop-color="${color.psBlue}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${color.psBlue}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="leaf" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${color.psBlueFill}"/>
      <stop offset="1" stop-color="${color.psBlue}"/>
    </linearGradient>
    <clipPath id="cob"><path d="${COB}"/></clipPath>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${cornerRadius}" fill="${color.surface0}"/>
  <rect width="${SIZE}" height="${SIZE}" rx="${cornerRadius}" fill="url(#glow)"/>
  <g transform="translate(256 262) scale(${artScale}) rotate(-8) translate(-256 -268)">
    <path d="${COB}" fill="${color.foreground}"/>
    <g clip-path="url(#cob)">${kernels()}</g>
    <path d="${COB}" fill="none" ${outline}/>
    <path d="${LEFT_LEAF}" fill="url(#leaf)" ${outline}/>
    ${vein(LEFT_VEIN)}
    <path d="${RIGHT_LEAF}" fill="url(#leaf)" ${outline}/>
    ${vein(RIGHT_VEIN)}
  </g>
</svg>
`;
}

/** Pack PNGs into a .ico container (PNG-in-ICO: every modern browser and Windows read it). */
function ico(entries: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const directory = Buffer.alloc(16 * entries.length);
  let offset = header.length + directory.length;
  entries.forEach(({ size, png }, i) => {
    const at = i * 16;
    directory[at] = size >= 256 ? 0 : size;
    directory[at + 1] = size >= 256 ? 0 : size;
    directory.writeUInt16LE(1, at + 4); // color planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });
  return Buffer.concat([header, directory, ...entries.map((e) => e.png)]);
}

const TILE = { artScale: 0.9, cornerRadius: 116 };
const SQUARE = { artScale: 0.86, cornerRadius: 0 };
const MASKABLE = { artScale: 0.72, cornerRadius: 0 };

async function main(): Promise<void> {
  mkdirSync(publicDir, { recursive: true });
  const tileSvg = renderSvg(TILE);
  writeFileSync(join(publicDir, 'icon.svg'), tileSvg);

  const executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const rasterize = async (svg: string, size: number): Promise<Buffer> => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
    );
    return page.screenshot({ type: 'png', omitBackground: true });
  };

  // Rasters share one page (viewport + content), so they must run one at a time.
  const faviconEntries: { size: number; png: Buffer }[] = [];
  for (const size of [16, 32, 48]) faviconEntries.push({ size, png: await rasterize(tileSvg, size) });
  const outputs: [string, Buffer][] = [
    ['favicon.ico', ico(faviconEntries)],
    ['icon-192.png', await rasterize(tileSvg, 192)],
    ['icon-512.png', await rasterize(tileSvg, 512)],
    ['icon-maskable-512.png', await rasterize(renderSvg(MASKABLE), 512)],
    ['apple-touch-icon.png', await rasterize(renderSvg(SQUARE), 180)],
  ];
  await browser.close();

  for (const [name, data] of outputs) writeFileSync(join(publicDir, name), data);
  console.log(`wrote icon.svg and ${outputs.map(([name]) => name).join(', ')} to ${publicDir}`);
}

await main();
