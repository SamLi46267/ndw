import { rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import bulletins from '../js/live-bulletins.js';

const endpoint = 'https://api.weather.gov/alerts/active';
const fields = ['id', 'status', 'messageType', 'event', 'areaDesc', 'effective', 'sent',
  'expires', 'senderName', 'headline', 'description', 'instruction', 'references', 'geocode'];

export async function collectNws(fetcher = fetch, now = Date.now) {
  const features = [];
  const seen = new Set();
  let next = endpoint;
  let updated = null;
  while (next) {
    const url = new URL(next, endpoint);
    if (url.origin !== 'https://api.weather.gov' || url.pathname !== '/alerts/active' ||
        seen.has(url.href) || seen.size >= 20) {
      throw Error('Unexpected NWS pagination link');
    }
    seen.add(url.href);
    const res = await fetcher(url.href, {
      headers: { Accept: 'application/geo+json', 'User-Agent': 'GeoWarning (https://geowarning.cn)' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) {
      const problem = await res.json().catch(() => null);
      const detail = typeof problem?.detail === 'string' ? ' · ' + problem.detail.slice(0, 350) : '';
      throw Error('NWS active alerts HTTP ' + res.status + detail);
    }
    const page = await res.json();
    if (page?.type !== 'FeatureCollection' || !Array.isArray(page.features)) {
      throw Error('Unexpected NWS active alerts response');
    }
    if (seen.size === 1) updated = page.updated || null;
    for (const feature of page.features) {
      const source = feature?.properties;
      if (!source || typeof source !== 'object') throw Error('Invalid NWS alert properties');
      const properties = Object.fromEntries(fields.filter(key => Object.hasOwn(source, key)).map(key => [key, source[key]]));
      features.push({ type: 'Feature', properties });
    }
    next = page.pagination?.next;
  }
  const checked = now();
  const snapshot = { type: 'FeatureCollection', checkedAt: new Date(checked).toISOString(), updated, features };
  bulletins.readFeed(snapshot, checked);
  return snapshot;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dest = process.argv[2] || fileURLToPath(new URL('../public-data/nws-active-alerts.json', import.meta.url));
  try {
    const snapshot = await collectNws();
    await writeFile(dest + '.tmp', JSON.stringify(snapshot) + '\n');
    await rename(dest + '.tmp', dest);
    console.log('NWS snapshot collected at ' + snapshot.checkedAt + ' with ' + snapshot.features.length + ' messages');
  } catch (error) {
    const message = [error.message, error.cause?.code].filter(Boolean).join(' · ');
    const annotation = message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
    console.error(process.env.GITHUB_ACTIONS ? '::error title=NWS collection failed::' + annotation : message);
    process.exitCode = 1;
  }
}
