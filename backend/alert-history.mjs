import { createHash } from 'node:crypto';

// Preserve every observed warning revision, including before an empty refresh.
export function archiveWarnings(archive = {}, entries = {}) {
  const result = { ...archive };
  for (const [route, entry] of Object.entries(entries)) {
    for (const alert of entry.data?.alerts || entry.data || []) {
      const identity = alert.AlertID ?? alert.alertId ?? alert.id ?? '';
      const digest = createHash('sha256').update(JSON.stringify(alert)).digest('hex').slice(0, 20);
      const key = route + ':' + identity + ':' + digest;
      const previous = result[key];
      result[key] = { route, alert, firstSeen: previous?.firstSeen ?? entry.checkedAt,
        lastSeen: Math.max(previous?.lastSeen || 0, entry.checkedAt) };
    }
  }
  return result;
}

export function mergeQuakeRows(existing, incoming) {
  const identified = new Map();
  const legacy = new Map();
  const identifiedLocations = new Set();
  for (const row of [...existing, ...incoming]) {
    const location = [row[0], Number(row[1]).toFixed(3), Number(row[2]).toFixed(3)].join(':');
    if (row[7]) {
      identified.set(row[7], row);
      identifiedLocations.add(location);
      legacy.delete(location);
    } else if (!identifiedLocations.has(location)) {
      legacy.set(location, row);
    }
  }
  return [...identified.values(), ...legacy.values()].sort((a, b) => b[0] - a[0]);
}
