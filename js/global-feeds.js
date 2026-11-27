/* Shared live feed checks for the global map and list. */
(function (root) {
  'use strict';

  const interval = 3 * 60000;
  const usgsUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
  const gdacsUrl = 'https://www.gdacs.org/xml/rss.xml';
  const gdacsTypes = ['WF', 'FL', 'TC', 'DR', 'VO', 'TS'];

  async function get(url, format) {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw Error('Feed HTTP ' + response.status);
    return response[format]();
  }

  function readUsgs(data) {
    const generated = data?.metadata?.generated;
    const now = Date.now();
    if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features) ||
        !Number.isFinite(generated) || generated > now + 300000 || now - generated >= 3600000) {
      throw Error('Invalid or overdue USGS feed');
    }
    const earthquakes = data.features.map(feature => {
      const p = feature?.properties;
      const [longitude, latitude, depth_km] = feature?.geometry?.coordinates || [];
      if (!p || !feature.id || !Number.isFinite(p.mag) || !Number.isFinite(p.time) ||
          !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
          !Number.isFinite(latitude) || Math.abs(latitude) > 90) return null;
      return { id: feature.id, magnitude: p.mag, place: p.place, timestamp: p.time,
        longitude, latitude, depth_km, alert: p.alert, tsunami: p.tsunami == null ? null : Boolean(p.tsunami),
        intensity_mmi: p.mmi, significance: p.sig, event_type: p.type, url: p.url };
    }).filter(Boolean);
    if (data.features.length && !earthquakes.length) throw Error('Invalid USGS earthquake records');
    return { source: 'USGS', sourceName: 'USGS Earthquake Hazards Program',
      fetchedAt: new Date(generated).toISOString(), earthquakes };
  }

  function episodeKey(properties) {
    return [properties.eventtype, properties.eventid, properties.episodeid].join(':');
  }

  function readGdacs(xml, snapshot) {
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error('Unexpected XML declaration');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const channel = doc.querySelector('rss > channel');
    if (!channel || doc.querySelector('parsererror')) throw Error('Invalid GDACS RSS feed');

    const checkedAt = new Date().toISOString();
    const published = new Map((snapshot?.features || []).map(feature => [episodeKey(feature.properties), feature.properties]));
    const latest = new Map();
    for (const item of channel.querySelectorAll(':scope > item')) {
      const fields = Object.fromEntries(Array.from(item.children, node => [node.localName, node.textContent.trim()]));
      const eventtype = fields.eventtype;
      if (!gdacsTypes.includes(eventtype) || fields.iscurrent?.toLowerCase() === 'false') continue;
      const eventid = fields.eventid;
      const geo = name => item.getElementsByTagNameNS('*', name)[0]?.textContent.trim();
      const [lat, lon] = (fields.point || geo('point') || '').split(/\s+/);
      const latitude = Number(lat || geo('lat') || undefined);
      const longitude = Number(lon || geo('long') || undefined);
      if (!eventid || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
          !Number.isFinite(longitude) || Math.abs(longitude) > 180) throw Error('Invalid GDACS event');
      const episodeid = fields.episodeid || '';
      const detail = published.get(episodeKey({ eventtype, eventid, episodeid })) || {};
      const properties = {
        ...detail, eventtype, eventid, episodeid, name: detail.name || fields.title,
        description: detail.description || fields.description, country: fields.country || detail.country,
        alertlevel: fields.alertlevel, fromdate: fields.fromdate, todate: fields.todate,
        datemodified: fields.pubDate, url: { report: fields.link || detail.url?.report },
        _active: true, _currentFeed: true, iscurrent: true, _verifiedAt: checkedAt
      };
      const key = eventtype + ':' + eventid;
      if (!latest.has(key) || Number(episodeid) > Number(latest.get(key).properties.episodeid)) {
        latest.set(key, { type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] }, properties });
      }
    }
    return { source: 'GDACS', checkedAt, features: Array.from(latest.values()) };
  }

  function loader(url, format, path, convert, records, timestamp) {
    let pending;
    let cached;
    return () => {
      if (pending) return pending;
      pending = Promise.all([
        get(url, format).catch(() => null),
        get(path, 'json').catch(() => null)
      ]).then(([raw, published]) => {
        const now = Date.now();
        const valid = value => {
          const time = Date.parse(value?.[timestamp]);
          return Array.isArray(value?.[records]) && Number.isFinite(time) && time <= now + 300000;
        };
        const snapshot = valid(published) ? published : null;
        let live;
        try { if (raw) live = convert(raw, snapshot); } catch (_) { /* Keep usable published data. */ }
        const received = [live, snapshot].filter(valid).sort((a, b) => Date.parse(b[timestamp]) - Date.parse(a[timestamp]))[0];
        if (received && (!cached || Date.parse(received[timestamp]) >= Date.parse(cached[timestamp]))) cached = received;
        return { data: cached || null, fetched: Boolean(received) };
      }).finally(() => { pending = null; });
      return pending;
    };
  }

  function updateStatus(results, previous) {
    const [quake, gdacs] = results;
    if (!quake.fetched && !gdacs.fetched) return 'globalUpdateFailed';
    const now = Date.now();
    const gdacsTime = Date.parse(gdacs.data?.checkedAt);
    if (!root.GdacsStatus.quakeSnapshotFresh(quake.data, now) ||
        !Number.isFinite(gdacsTime) || now - gdacsTime >= 1800000) return 'globalPartial';
    return previous[0]?.fetchedAt !== quake.data?.fetchedAt || previous[1]?.checkedAt !== gdacs.data?.checkedAt ?
      'globalUpdated' : 'globalUnchanged';
  }

  root.NDGlobalFeeds = {
    interval, updateStatus,
    requestUrl: 'https://github.com/SamLi46267/ndw/issues/new?template=global-data-update.yml',
    quakes: loader(usgsUrl, 'json', 'public-data/global-earthquakes.json', readUsgs, 'earthquakes', 'fetchedAt'),
    gdacs: loader(gdacsUrl, 'text', 'public-data/gdacs-events.json', readGdacs, 'features', 'checkedAt')
  };
})(window);
