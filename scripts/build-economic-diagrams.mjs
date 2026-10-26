import { writeFile, mkdir } from 'node:fs/promises';

// Book-style technical plates, authored as vectors rather than generated artwork.
const root = new URL('../public/writing/country-that-can-see-itself/', import.meta.url);
await mkdir(root, { recursive: true });
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const text = (x, y, lines, cls = 'label') => `<text class="${cls}" text-anchor="middle" dominant-baseline="central">${lines.map((line, i) => `<tspan x="${x}" y="${y + i * (cls === 'small' ? 18 : 22)}">${esc(line)}</tspan>`).join('')}</text>`;
function box(x, y, w, h, main, sub = [], cls = '') {
  const total = main.length * 22 + (sub.length ? 6 + sub.length * 18 : 0);
  const top = y + (h - total) / 2;
  return `<g class="node ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>${text(x + w/2, top + 11, main)}${sub.length ? text(x + w/2, top + main.length * 22 + 15, sub, 'small') : ''}</g>`;
}
const arrow = (id, d, cls = '') => `<path class="edge ${cls}" d="${d}" marker-end="url(#${id}-arrow)"/>`;
const line = d => `<path class="edge" d="${d}"/>`;
function tag(x, y, w, lines) {
  return `<rect class="label-gap" x="${x-w/2}" y="${y-13}" width="${w}" height="${lines.length*22+4}"/>${text(x,y,lines,'small')}`;
}
function plate(id, width, height, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="economic-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc">
<title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc>
<style>
.economic-svg{--e-bg:#f6f4ef;--e-ink:#1c1b19;--e-muted:#5c574f;--e-line:#857d71;--e-node:#eeebe4;--e-good:#315b39;--e-good-bg:#e3ebe0;background:var(--background,var(--e-bg));font-family:var(--font-geist-sans,system-ui,sans-serif)}
@media(prefers-color-scheme:dark){.economic-svg{--e-bg:#121110;--e-ink:#eceae4;--e-muted:#a8a299;--e-line:#938a7c;--e-node:#1c1b19;--e-good:#b5ceb7;--e-good-bg:#1d2c21}}
.economic-svg .label{font-size:18px;font-weight:500;fill:var(--foreground,var(--e-ink))}
.economic-svg .small{font-size:15px;font-weight:400;fill:var(--muted,var(--e-muted))}
.economic-svg .section{font-size:17px;font-weight:500;fill:var(--foreground,var(--e-ink))}
.economic-svg .node rect{fill:var(--diagram-node,var(--e-node));stroke:var(--diagram-line,var(--e-line));stroke-width:1.25}
.economic-svg .node.output rect{fill:var(--diagram-good,var(--e-good-bg))}
.economic-svg .node.output .label{fill:var(--diagram-good-ink,var(--e-good))}
.economic-svg .edge{fill:none;stroke:var(--diagram-line,var(--e-line));stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
.economic-svg .edge.unmatched{stroke-dasharray:5 5}
.economic-svg .arrow-tip{fill:var(--diagram-line,var(--e-line))}
.economic-svg .label-gap{fill:var(--background,var(--e-bg))}
</style>
<defs><marker id="${id}-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path class="arrow-tip" d="M1 1 L7 4 L1 7Z"/></marker></defs>
${body}
</svg>\n`;
}
const out=[];
const pipelineDescription='UPI payments, GST e-way bills and FASTag crossings enter a cleaning and time-alignment stage. Weekly features feed a nowcast with uncertainty. Estimates are checked against surveys and published statistics.';
let id='econ-pipeline-wide';
out.push(['pipeline',plate(id,792,310,'From events to an estimate',pipelineDescription,
 box(12,24,142,44,['UPI payments'])+box(12,110,142,44,['GST e-way bills'])+box(12,196,142,44,['FASTag passes'])+
 box(206,86,150,92,['Clean + align'],['dedupe · reversals','event vs arrival time'])+
 box(412,86,150,92,['Weekly features'],['region · week','coverage recorded'])+
 box(618,86,160,92,['Nowcast'],['estimate + range'],'output')+
 line('M154 46 H178 V218 H154')+arrow(id,'M154 132 H200')+arrow(id,'M356 132 H406')+arrow(id,'M562 132 H612')+
 box(412,238,366,62,['Validate against benchmarks'],['surveys + published statistics'])+arrow(id,'M698 178 V210 H595 V232')
)]);
id='econ-pipeline-phone';
out.push(['pipeline-mobile',plate(id,320,562,'From events to an estimate',pipelineDescription,
 box(8,12,94,62,['UPI'],['payments'])+box(113,12,94,62,['GST'],['e-way bills'])+box(218,12,94,62,['FASTag'],['crossings'])+
 line('M55 74 V96 H265 V74')+arrow(id,'M160 74 V116')+
 box(30,122,260,76,['Clean + align time'],['dedupe · reversals · late events'])+arrow(id,'M160 198 V228')+
 box(30,234,260,76,['Weekly features'],['region · week · coverage'])+arrow(id,'M160 310 V340')+
 box(30,346,260,76,['Nowcast'],['estimate + uncertainty'],'output')+arrow(id,'M160 422 V452')+
 box(30,458,260,80,['Check against benchmarks'],['surveys + published statistics'])
)]);
const permissionDescription='Three separate access paths: source totals pass disclosure controls to a public index; a borrower authorises scoped, expiring access for a named lender; case records pass an authority and audit check before a human reviewer sees them.';
id='econ-permissions-wide';
let lanes='';
for(const [y,title,left,lsub,gate,gsub,right,rsub] of [
 [32,'Public statistics','Source totals','computed at source','Aggregate + protect','group sizes · query controls','Public index','no personal records'],
 [152,'A loan application',"Borrower’s records",'at the source provider','Consent check','purpose · scope · expiry','Named lender','bounded data use'],
 [272,'An investigation','Specific case records','authorised scope only','Authority + audit log','case-specific permissions','Human reviewer','evidence + correction']
]) lanes+=text(130,y-17,[title],'section')+box(12,y,194,72,[left],[lsub])+box(276,y,230,72,[gate],[gsub])+box(576,y,204,72,[right],[rsub],title==='Public statistics'?'output':'')+arrow(id,`M206 ${y+36} H270`)+arrow(id,`M506 ${y+36} H570`);
out.push(['permissions',plate(id,792,360,'Three purposes, three permission checks',permissionDescription,lanes)]);
id='econ-permissions-phone';lanes='';
for(const [y,title,source,gate,gsub,target,tsub] of [
 [20,'Public statistics','Totals computed at source','Aggregate + protect','group sizes · query controls','Public index','no personal records'],
 [250,'A loan application',"Borrower’s records at provider",'Consent check','purpose · scope · expiry','Named lender','bounded data use'],
 [480,'An investigation','Specific case records','Authority + audit log','case-specific permissions','Human reviewer','evidence + correction']
]) lanes+=text(160,y,[title],'section')+text(160,y+35,[source],'small')+arrow(id,`M160 ${y+51} V${y+71}`)+box(30,y+77,260,62,[gate],[gsub])+arrow(id,`M160 ${y+139} V${y+159}`)+text(160,y+177,[target])+text(160,y+201,[tsub],'small');
out.push(['permissions-mobile',plate(id,320,708,'Three purposes, three permission checks',permissionDescription,lanes)]);
const evidenceDescription='Seller A invoices Buyer B. Transport evidence may support the goods journey from A to B, while settlement flows from B back to A. A dashed connection means an observation has not been matched; it does not establish fraud.';
id='econ-evidence-wide';
out.push(['evidence',plate(id,792,370,'Three accounts of one transaction',evidenceDescription,
 box(24,130,160,112,['Seller A'],['GSTIN A'])+box(608,130,160,112,['Buyer B'],['GSTIN B'])+
 arrow(id,'M184 151 C322 50 470 50 602 151')+tag(396,66,186,['Invoice: A to B'])+
 box(294,150,204,76,['Transport evidence'],['e-way bill + toll record'])+arrow(id,'M184 188 H288')+arrow(id,'M498 188 H602','unmatched')+text(552,158,['unmatched'],'small')+
 arrow(id,'M608 222 C470 318 322 318 190 222')+tag(396,298,210,['Settlement: B to A'])+
 text(396,350,['A missing match triggers review, not a fraud verdict.'],'small')
)]);
id='econ-evidence-phone';
out.push(['evidence-mobile',plate(id,320,448,'Three accounts of one transaction',evidenceDescription,
 box(98,16,124,64,['Seller A'],['GSTIN A'])+box(98,364,124,64,['Buyer B'],['GSTIN B'])+
 arrow(id,'M98 48 H32 V396 H92')+tag(48,180,90,['Invoice','A to B'])+
 arrow(id,'M160 80 V144')+box(99,150,122,100,['Journey'],['e-way bill','toll record'])+arrow(id,'M160 250 V358','unmatched')+tag(160,290,122,['unmatched','review needed'])+
 arrow(id,'M222 396 H288 V48 H228')+tag(272,180,92,['Settlement','B to A'])
)]);
for(const [name,svg] of out) await writeFile(new URL(`${name}.svg`,root),svg);
console.log('Built three technical diagrams, with desktop and phone layouts.');
