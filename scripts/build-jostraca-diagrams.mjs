import { writeFile } from "node:fs/promises";

// Original diagrams from the essay, redrawn as responsive, theme-aware vectors.
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const label = (x, y, lines, kind = "main") => `<text class="${kind}" x="${x}" y="${y}" text-anchor="middle">${lines.map((s, i) => `<tspan x="${x}" dy="${i ? 23 : 0}">${escape(s)}</tspan>`).join('')}</text>`;
const node = (x, y, w, h, primary, secondary = [], kind = "") => `<g class="node ${kind}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/>${label(x + w/2, secondary.length ? y + 31 : y + h/2 + 6 - (primary.length - 1)*11.5, primary)}${secondary.length ? label(x + w/2, y + h - 22 - 20*(secondary.length - 1), secondary, "secondary") : ''}</g>`;
const arrow = (id, points, note = "", x = 0, y = 0) => `<path class="connector" d="${points}" marker-end="url(#${id}-arrow)"/>${note ? label(x, y, [note], "secondary") : ''}`;
const diamond = (x, y, w, h, text) => `<g class="node"><path d="M${x+w/2} ${y} L${x+w} ${y+h/2} L${x+w/2} ${y+h} L${x} ${y+h/2}Z"/>${label(x+w/2,y+h/2+6,[text])}</g>`;
const svg = (id, w, h, title, description, body) => `<svg class="jostraca-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-title ${id}-desc">
<title id="${id}-title">${escape(title)}</title><desc id="${id}-desc">${escape(description)}</desc>
<style>
.jostraca-svg { --svg-bg:#f6f4ef; --svg-ink:#1c1b19; --svg-muted:#5c574f; --svg-node:#eeebe4; --svg-line:#8a8275; --svg-good:#e3ebe0; --svg-good-ink:#315b39; --svg-risk:#efe4dc; --svg-risk-ink:#704937; background:var(--background,var(--svg-bg)); font-family:var(--font-geist-sans,system-ui,sans-serif); }
@media(prefers-color-scheme:dark) { .jostraca-svg { --svg-bg:#121110; --svg-ink:#eceae4; --svg-muted:#a8a299; --svg-node:#1c1b19; --svg-line:#756d60; --svg-good:#1d2c21; --svg-good-ink:#b5ceb7; --svg-risk:#30251f; --svg-risk-ink:#d7b9a5; } }
.jostraca-svg .main { font-size:18px; font-weight:500; fill:var(--foreground,var(--svg-ink)); }
.jostraca-svg .secondary { font-size:15px; font-weight:400; fill:var(--muted,var(--svg-muted)); }
.jostraca-svg .phase { font-size:15px; font-weight:500; fill:var(--muted,var(--svg-muted)); }
.jostraca-svg .node rect,.jostraca-svg .node path { fill:var(--diagram-node,var(--svg-node)); stroke:var(--diagram-line,var(--svg-line)); stroke-width:1; stroke-linejoin:round; }
.jostraca-svg .good rect { fill:var(--diagram-good,var(--svg-good)); stroke:none; }
.jostraca-svg .good .main { fill:var(--diagram-good-ink,var(--svg-good-ink)); }
.jostraca-svg .risk rect { fill:var(--diagram-risk,var(--svg-risk)); stroke:none; }
.jostraca-svg .risk .main { fill:var(--diagram-risk-ink,var(--svg-risk-ink)); }
.jostraca-svg .connector { fill:none; stroke:var(--diagram-line,var(--svg-line)); stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.jostraca-svg .arrow { fill:var(--diagram-line,var(--svg-line)); }
</style>
<defs><marker id="${id}-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="arrow" d="M1 1 L7 4 L1 7Z"/></marker></defs>
${body}
</svg>\n`;

const diagrams = [];
let id = 'phases-wide';
diagrams.push(['two-phases', svg(id,720,208,'Define first. Write second.','The callback constructs the full in-memory tree before file policy writes files and a baseline copy.',
  label(178,25,['Define phase'],'phase') + label(542,25,['Build phase'],'phase') +
  node(8,52,156,110,['Your callback'],['calls components']) + node(190,52,156,110,['In-memory tree'],['no disk writes']) +
  node(374,52,156,110,['File policy'],['one mode per file']) + node(556,52,156,110,['Files on disk'],['+ baseline copy']) +
  arrow(id,'M164 107 H185') + arrow(id,'M346 107 H369') + arrow(id,'M530 107 H551') +
  label(538,193,['write · preserve · present · diff · merge'],'secondary'))]);
id = 'phases-phone';
diagrams.push(['two-phases-mobile', svg(id,300,514,'Define first. Write second.','The callback constructs the full in-memory tree before file policy writes files and a baseline copy.',
  label(150,22,['Define phase'],'phase') + node(24,38,252,80,['Your callback'],['calls components']) + arrow(id,'M150 118 V140') +
  node(24,145,252,80,['In-memory tree'],['no disk writes']) + arrow(id,'M150 225 V273') + label(150,256,['Build phase'],'phase') +
  node(24,278,252,80,['File policy'],['one mode per file']) + arrow(id,'M150 358 V380') + node(24,385,252,80,['Files on disk'],['+ baseline copy']) +
  label(150,495,['write · preserve · present · diff · merge'],'secondary'))]);

id='outcomes-wide';
diagrams.push(['second-run-outcomes', svg(id,720,370,'What happens to the hand edit?','The default overwrites the edit. Merge keeps it on the same machine. A fresh clone without the baseline overwrites it.',
  node(6,135,144,100,['Hand-edited','file']) +
  node(208,12,210,100,['Default settings'],['existing mode: write']) + node(208,135,210,100,['merge: true'],['same machine']) + node(208,258,210,100,['merge: true'],['fresh clone, no baseline']) +
  node(470,12,244,100,['Edit overwritten'],['reported as written','exit 0'],'risk') + node(470,135,244,100,['Edit kept'],['three-way merge'],'good') + node(470,258,244,100,['Edit overwritten'],['reported as written','exit 0'],'risk') +
  arrow(id,'M150 185 H174 V62 H202') + arrow(id,'M150 185 H202') + arrow(id,'M174 185 V308 H202') +
  arrow(id,'M418 62 H464') + arrow(id,'M418 185 H464') + arrow(id,'M418 308 H464'))]);
id='outcomes-phone';
diagrams.push(['second-run-outcomes-mobile', svg(id,300,738,'What happens to the hand edit?','Each path begins with a hand-edited file. Default settings overwrite it. Merge on the same machine keeps it. A fresh clone without the baseline overwrites it.',
  label(150,22,['Starting point: a hand-edited file'],'phase') +
  node(24,40,252,80,['Default settings'],['existing mode: write']) + arrow(id,'M150 120 V138') + node(24,144,252,80,['Edit overwritten'],['written, exit 0'],'risk') +
  node(24,282,252,80,['merge: true'],['same machine']) + arrow(id,'M150 362 V380') + node(24,386,252,80,['Edit kept'],['three-way merge'],'good') +
  node(24,524,252,80,['merge: true'],['fresh clone, no baseline']) + arrow(id,'M150 604 V622') + node(24,628,252,80,['Edit overwritten'],['written, exit 0'],'risk'))]);

id='proposal-wide';
diagrams.push(['proposed-default', svg(id,720,300,'A check before any overwrite','New files are written. Existing files are compared with the baseline: unchanged files use the chosen mode; edited files are skipped and reported with exit one.',
  node(4,36,154,90,['Generated file']) + diamond(193,32,156,100,'On disk?') + diamond(389,32,156,100,'Unchanged?') + node(580,36,136,90,['Apply chosen','mode']) +
  node(183,205,176,80,['Write the file']) + node(410,205,282,80,['Edited by a person'],['skip · report edited · exit 1'],'risk') +
  arrow(id,'M158 81 H187') + arrow(id,'M349 82 H383','yes',369,67) + arrow(id,'M545 82 H574','yes',564,67) +
  arrow(id,'M271 132 V198','no',291,174) + arrow(id,'M467 132 V174 H551 V198','no',487,154))]);
id='proposal-phone';
diagrams.push(['proposed-default-mobile', svg(id,300,702,'A check before any overwrite','Write new files. For existing files, compare with the baseline. Apply the chosen mode only if unchanged; otherwise skip and report edited, exiting one.',
  node(24,10,252,66,['Generated file']) + arrow(id,'M150 76 V102') + diamond(73,110,154,86,'On disk?') +
  arrow(id,'M150 196 V253','no',171,223) + node(24,260,252,65,['Write the file']) +
  arrow(id,'M227 153 H283 V362 H150 V383','yes',265,141) + diamond(61,390,178,86,'Unchanged?') +
  arrow(id,'M150 476 V500','yes',174,498) + node(24,510,252,65,['Apply chosen mode']) +
  arrow(id,'M61 433 H10 V622 H20','no',31,460) + node(24,585,252,95,['Edited by a person'],['skip · report edited','exit 1'],'risk'))]);

for (const [name, content] of diagrams) {
  await writeFile(new URL(`../public/writing/jostraca/${name}.svg`, import.meta.url), content);
}
console.log('Built six theme-aware SVGs: desktop and phone versions of each diagram.');
