import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { get as httpGet } from 'node:http';

const base = new URL(process.env.SEO_TEST_URL || 'http://127.0.0.1:3103');
const site = JSON.parse(readFileSync(new URL('../data/site-content.json', import.meta.url))).site;
const canonical = new URL(site.url);
const headers = { 'Accept-Encoding': 'identity' };
async function request(path) {
  const response = await fetch(new URL(path, base), { headers });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return { response, text: await response.text() };
}
function xml(text) {
  return new JSDOM(text, { contentType: 'text/xml' }).window.document;
}
function published(kind) {
  const dir = new URL(`../content/${kind}/`, import.meta.url);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(file => file.endsWith('.mdx')).map(file => {
    const post = matter(readFileSync(new URL(file, dir), 'utf8'));
    return { ...post, slug: file.slice(0, -4), kind };
  }).filter(post => !post.data.draft);
}
const sitemap = xml((await request('/sitemap.xml')).text);
const paths = [...sitemap.querySelectorAll('url > loc')].map(e => {
  const url = new URL(e.textContent);
  assert.equal(url.origin, canonical.origin, 'Sitemap uses canonical host');
  assert(!/^\/(admin|api)\b/.test(url.pathname), 'Sitemap contains public pages only');
  return url.pathname;
});
assert.equal(paths.length, new Set(paths).size, 'No duplicate sitemap entries');
assert(paths.includes('/') && paths.includes('/about') && paths.includes('/work'));
const posts = [...published('blog'), ...published('notes')];
for (const post of posts) assert(paths.includes(`/${post.kind}/${post.slug}`), `Published ${post.slug} discovered automatically`);
const docs = new Map();
const titles = new Set();
for (const path of paths) {
  const { text, response } = await request(path);
  assert.match(response.headers.get('content-type'), /text\/html/);
  const d = new JSDOM(text).window.document;
  assert(d.title.trim(), `${path}: title present`);
  assert(!titles.has(d.title), `${path}: unique title`);
  titles.add(d.title);
  assert(d.querySelector('meta[name="description"]')?.content.trim(), `${path}: description present`);
  assert.equal(d.querySelector('link[rel="canonical"]')?.href, new URL(path, canonical).href, `${path}: canonical`);
  assert.equal(d.querySelectorAll('h1').length, 1, `${path}: one visible H1 without JavaScript`);
  assert(!/noindex|none/.test(d.querySelector('meta[name="robots"]')?.content || ''), `${path}: indexable`);
  assert(!/noindex|none/.test(response.headers.get('x-robots-tag') || ''), `${path}: indexable HTTP headers`);
  assert.equal(d.documentElement.lang, 'en');
  const entities = [...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(el => {
    const data = JSON.parse(el.textContent);
    assert.equal(data['@context'], 'https://schema.org');
    return data['@graph'] || [data];
  });
  assert(entities.some(e => e['@type'] === 'Person' && e.name === site.name), `${path}: identity`);
  assert.equal(entities.filter(e => e['@type'] === 'ProfilePage').length, path === '/about' ? 1 : 0, `${path}: profile schema belongs only to About`);
  if (path.startsWith('/blog/')) {
    const article = entities.find(e => e['@type'] === 'BlogPosting');
    assert.equal(article?.author.name, site.name);
    assert.equal(article?.author.url, new URL('/about', canonical).href);
    assert.equal(article?.url, new URL(path, canonical).href);
    assert(article?.image && article?.datePublished && article?.dateModified);
    assert.equal(d.querySelector('a[rel="author"]')?.textContent, site.name, 'Visible author matches schema');
  }
  assert(d.querySelector('link[rel="alternate"][type="text/plain"]'), `${path}: full-text discovery`);
  const image = d.querySelector('meta[property="og:image"]')?.content;
  assert(image && new URL(image).protocol === 'https:', `${path}: social image`);
  docs.set(path, d);
}
// Verify internal HTML destinations and fragments without needing client-side navigation.
for (const [path, d] of docs) for (const a of d.querySelectorAll('a[href]')) {
  const href = new URL(a.getAttribute('href'), new URL(path, canonical));
  if (href.origin !== canonical.origin || href.pathname.startsWith('/cdn-cgi/')) continue;
  if (docs.has(href.pathname)) {
    if (href.hash) assert(docs.get(href.pathname).getElementById(decodeURIComponent(href.hash.slice(1))), `${path}: valid fragment ${href}`);
  } else if (!/\.(svg|png|jpe?g|webp|pdf|xml|txt)$/.test(href.pathname)) {
    const r = await fetch(new URL(href.pathname, base), { headers });
    assert(r.ok, `${path}: no broken internal link ${href.pathname}`);
  }
}
const reachable = new Set(['/']);
for (let depth = 0; depth < 3; depth++) for (const path of [...reachable]) {
  for (const a of docs.get(path)?.querySelectorAll('a[href]') || []) {
    const url = new URL(a.getAttribute('href'), new URL(path, canonical));
    if (url.origin === canonical.origin && docs.has(url.pathname)) reachable.add(url.pathname);
  }
}
for (const path of paths) assert(reachable.has(path), `${path}: reachable within three links`);
const robots = (await request('/robots.txt')).text;
for (const agent of ['*', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'Bingbot']) {
  assert(robots.includes(`User-Agent: ${agent}\nAllow: /\nDisallow: /admin`), `${agent}: public crawl allowed and private routes excluded`);
}
const index = (await request('/llms.txt')).text;
const full = (await request('/llms-full.txt')).text;
assert(index.includes(`${site.url}/sitemap.xml`));
assert(!full.includes('Status: undefined'));
for (const post of posts) {
  assert(index.includes(`${site.url}/${post.kind}/${post.slug}`));
  assert(full.includes(post.content.trim()), `${post.slug}: full body exported`);
}
const feed = xml((await request('/feed.xml')).text);
assert.equal(feed.querySelectorAll('item').length, published('blog').length);
const admin = new JSDOM((await request('/admin')).text).window.document;
assert.match(admin.querySelector('meta[name="robots"]')?.content || '', /noindex/, 'Private studio not indexed');
const missing = await fetch(new URL('/seo-check-nonexistent-page', base), { headers });
assert.equal(missing.status, 404, 'Missing pages are real 404s');
for (const path of ['/', '/about', '/work', '/blog']) {
  const image = docs.get(path)?.querySelector('meta[property="og:image"]')?.content;
  if (image) assert((await fetch(new URL(new URL(image).pathname, base), { headers })).ok, `${path}: social image loads`);
}
if (base.hostname === '127.0.0.1' || base.hostname === 'localhost') {
  // Fetch reserves Host; use the HTTP client to exercise host-based redirects.
  const aliasRequest = path => new Promise((resolve, reject) => {
    httpGet(new URL(path, base), { headers: { Host: 'personal-website-ten-rho-90.vercel.app' } }, res => {
      res.resume();
      resolve({ status: res.statusCode, location: res.headers.location, robots: res.headers['x-robots-tag'] });
    }).on('error', reject);
  });
  for (const path of ['/', '/work/asteria', '/blog/jostraca-second-run', '/sitemap.xml']) {
    const r = await aliasRequest(path);
    assert.equal(r.status, 308, `${path}: duplicate public alias redirects permanently`);
    assert.equal(r.location, new URL(path, canonical).href);
  }
  const adminAlias = await aliasRequest('/admin/sign-in');
  assert.match(adminAlias.robots || '', /noindex/, 'Alias redirect leaves auth routes private');
  assert(!adminAlias.location?.startsWith(canonical.origin), 'Public alias redirect does not intercept authentication');
}
console.log(`SEO checks passed: ${paths.length} public pages, canonical URLs, server-rendered headings and schema, internal links, crawler access, private noindex, RSS, social images, and ${posts.length} full-text articles.`);
