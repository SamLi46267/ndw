/* Shared GDACS date/status rules. Search results also contain ended events. */
(function (root) {
  function time(value) {
    if (!value) return NaN;
    var s = String(value);
    return Date.parse(/(?:Z|GMT|UTC|[+-]\d\d:?\d\d)$/i.test(s) ? s : s + (s.length === 10 ? 'T00:00:00Z' : 'Z'));
  }
  function active(p, now) {
    var current = p.iscurrent === true || String(p.iscurrent).toLowerCase() === 'true';
    var verified = time(p._verifiedAt);
    // todate describes a reporting period; it is not proof of incident closure.
    return p._active !== false && current && p._currentFeed === true &&
      isFinite(verified) && verified <= now + 300000;
  }
  function fresh(p, now) { var verified = time(p._verifiedAt); return isFinite(verified) && verified <= now + 300000 && now - verified < 1800000; }
  function reportTime(p) { return time(p.datemodified) || time(p.fromdate) || 0; }
  function isEarthquakeType(type) {
    return type == null || type === '' || type === 'earthquake' || type === '地震';
  }

  // Some older catalogs contain multiple origins for the same event.
  function uniqueCatalogRows(rows) {
    var seen = new Set();
    return rows.filter(function (row) {
      if (!row[7]) return true;
      if (seen.has(row[7])) return false;
      seen.add(row[7]);
      return true;
    });
  }

  function recentQuakes(snapshot, now) {
    var cutoff = now - 86400000;
    return (Array.isArray(snapshot?.earthquakes) ? snapshot.earthquakes : []).filter(function (quake) {
      return quake && isEarthquakeType(quake.event_type) && Number.isFinite(quake.timestamp) && quake.timestamp >= cutoff &&
        quake.timestamp <= now && Number.isFinite(quake.magnitude) &&
        Number.isFinite(quake.latitude) && Math.abs(quake.latitude) <= 90 &&
        Number.isFinite(quake.longitude) && Math.abs(quake.longitude) <= 180;
    });
  }
  function quakeSnapshotFresh(snapshot, now) {
    var checked = time(snapshot && snapshot.fetchedAt);
    return Number.isFinite(checked) && checked <= now + 300000 && now - checked < 3600000;
  }
  function quakeWindow(snapshot, now) {
    var checkedAt = time(snapshot && snapshot.fetchedAt);
    if (!Array.isArray(snapshot?.earthquakes) || !Number.isFinite(checkedAt) || checkedAt > now + 300000) return null;
    var fresh = quakeSnapshotFresh(snapshot, now);
    return { checkedAt: checkedAt, fresh: fresh, quakes: recentQuakes(snapshot, fresh ? now : checkedAt) };
  }

  function reportUrl(raw) {
    if (!raw) return '';
    try {
      var url = new URL(raw);
      if (url.protocol === 'http:' && /^(www\.)?gdacs\.org$/i.test(url.hostname)) url.protocol = 'https:';
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch (error) { return ''; }
  }
  var api = { isEarthquakeType: isEarthquakeType, uniqueCatalogRows: uniqueCatalogRows, time: time, active: active, fresh: fresh, reportTime: reportTime, recentQuakes: recentQuakes, quakeWindow: quakeWindow, quakeSnapshotFresh: quakeSnapshotFresh, reportUrl: reportUrl };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GdacsStatus = api;
})(typeof window === 'object' ? window : globalThis);
