#!/usr/bin/env node
/**
 * Collect historical data used by the Database tab and the recent-history
 * mode in Global Hazards.
 *
 *  - public-data/global-quakes-recent.json  (USGS, last 30 days, 2.5+)
 *  - public-data/gdacs-disaster-history.json (GDACS, monthly chunks, 24 months)
 *
 * Run daily by .github/workflows/collect-history.yml.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeQuakeRows } from './alert-history.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const RECENT_FILE = path.join(ROOT, 'public-data', 'global-quakes-recent.json');
const ARCHIVE_FILE = path.join(ROOT, 'public-data', 'global-quakes-history.json');
const GDACS_FILE = path.join(ROOT, 'public-data', 'gdacs-disaster-history.json');
const NOW = new Date();
const DAY = 86400000;

function isoDate(d) { return d.toISOString().slice(0, 10); }
function writeJson(file, value) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, file);
}
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { if (err.code === 'ENOENT') return fallback; throw err; }
}
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GeoWarning/1.0 (+https://geowarning.cn)', Accept: 'application/json' },
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) { throw new Error(url + ' HTTP ' + res.status); }
  return res.json();
}

export function usgsQuery(start, end) {
  const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
  url.search = new URLSearchParams({
    format: 'geojson', starttime: start.toISOString(), endtime: end.toISOString(),
    minmagnitude: '2.5', orderby: 'time'
  }).toString();
  return url.href;
}

export function usgsRows(collection) {
  const rows = [];
  for (const feature of collection.features || []) {
    const p = feature.properties || {};
    const [lon, lat, depth] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(p.time) || !Number.isFinite(p.mag) || !Number.isFinite(lon) ||
        !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) continue;
    rows.push([p.time, lon, lat, Number.isFinite(depth) ? depth : null, p.mag,
      p.place || '', p.type || 'earthquake', feature.id]);
  }
  return rows;
}

async function collectRecent() {
  const end = new Date(NOW);
  const start = new Date(NOW.getTime() - 30 * DAY);
  const data = await fetchJson(usgsQuery(start, end));
  const rows = usgsRows(data);
  rows.sort((a, b) => b[0] - a[0]);
  const out = {
    source: 'USGS',
    timezone: 'UTC',
    count: rows.length,
    range: [rows.length ? rows[rows.length - 1][0] : start.getTime(), rows.length ? rows[0][0] : end.getTime()],
    rows
  };
  writeJson(RECENT_FILE, out);
  console.log('USGS recent: ' + rows.length + ' rows');
}

function monthStart(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function nextMonth(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); }
function monthEnd(d) { return new Date(nextMonth(d).getTime() - DAY); }

// USGS includes both endpoints. Cover each UTC millisecond once across adjacent queries.
export function usgsMonthEnd(month, runTime) {
  return new Date(Math.min(nextMonth(month).getTime() - 1, runTime.getTime()));
}

async function collectEarthquakeArchive() {
  const start = monthStart(new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - 23, 1)));
  const end = new Date(NOW);
  const existing = readJson(ARCHIVE_FILE, { rows: [] });
  const incoming = [];
  for (let d = start; d <= end; d = nextMonth(d)) {
    const month = d.toISOString().slice(0, 7);
    try {
      const data = await fetchJson(usgsQuery(d, usgsMonthEnd(d, end)));
      incoming.push(...usgsRows(data));
      console.log('USGS ' + month + ': ' + (data.features || []).length);
    } catch (err) {
      console.warn('USGS ' + month + ' failed: ' + (err.message || err));
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  const rows = mergeQuakeRows(existing.rows || [], incoming);
  writeJson(ARCHIVE_FILE, {
    source: /apizero/i.test(existing.source || '') ? 'USGS / APIZERO' : 'USGS',
    timezone: 'UTC',
    generatedAt: NOW.toISOString(),
    count: rows.length,
    range: [rows.length ? rows[rows.length - 1][0] : start.getTime(), end.getTime()],
    rows
  });
  console.log('USGS retained archive: ' + rows.length + ' rows');
}

async function collectGdacsHistory() {
  const start = monthStart(new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - 23, 1)));
  const existing = readJson(GDACS_FILE, { features: [] });
  const map = new Map();
  (existing.features || []).forEach((f) => {
    const p = f.properties || {};
    map.set([p.eventtype, p.eventid, p.episodeid].join(':'), f);
  });
  for (let d = start; d <= NOW; d = nextMonth(d)) {
    const from = isoDate(d);
    const to = isoDate(monthEnd(d) > NOW ? NOW : monthEnd(d));
    const url = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH' +
      '?eventlist=' + encodeURIComponent('WF;FL;TC;DR') +
      '&fromDate=' + from + '&toDate=' + to +
      '&alertlevel=' + encodeURIComponent('Green;Orange;Red');
    try {
      const data = await fetchJson(url);
      (data.features || []).forEach((f) => {
        const p = f.properties || {};
        const key = [p.eventtype, p.eventid, p.episodeid].join(':');
        if (!key || key === '::') { return; }
        map.set(key, f);
      });
      console.log('GDACS ' + from.slice(0, 7) + ': ' + (data.features || []).length);
    } catch (err) {
      console.warn('GDACS ' + from.slice(0, 7) + ' failed: ' + (err.message || err));
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  const features = Array.from(map.values()).sort((a, b) => String((b.properties || {}).datemodified || '').localeCompare(String((a.properties || {}).datemodified || '')));
  const out = {
    source: 'GDACS',
    updatedAt: NOW.toISOString(),
    range: [isoDate(start), isoDate(NOW)],
    count: features.length,
    features
  };
  writeJson(GDACS_FILE, out);
  console.log('GDACS history: ' + features.length + ' events');
}

async function main() {
  await collectRecent();
  await collectEarthquakeArchive();
  await collectGdacsHistory();
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('History collection failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  });
}
