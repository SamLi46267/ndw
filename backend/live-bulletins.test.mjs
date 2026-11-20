import test from 'node:test';
import assert from 'node:assert/strict';
import bulletins from '../js/live-bulletins.js';

const now = Date.parse('2026-11-20T10:00:00Z');
const iso = delta => new Date(now + delta).toISOString();
function feature(id, changes) {
  return {
    type: 'Feature', properties: {
      id, status: 'Actual', messageType: 'Alert', event: 'Flood Warning', areaDesc: 'Example County',
      effective: iso(-7200000), sent: iso(-7200000), expires: iso(3600000), ...changes
    }
  };
}
function collection(features) {
  return { type: 'FeatureCollection', features, updated: iso(-1000) };
}

test('NWS shows unexpired, effective actual bulletins and removes superseded and canceled IDs', () => {
  const payload = collection([
    feature('new', { messageType: 'Update', sent: iso(-1000), references: [{ identifier: 'superseded' }], onset: iso(50000) }),
    feature('exercise', { status: 'Exercise' }), feature('expired', { expires: iso(0) }),
    feature('future', { effective: iso(1) }), feature('superseded'), feature('canceled'), feature('another'),
    feature('cancel', { messageType: 'Cancel', references: [{ identifier: 'canceled' }] }), feature('another')
  ]);
  const data = bulletins.readFeed(payload, now);
  assert.deepEqual(data.rows.map(r => r.id), ['new', 'another']);
  assert.equal(data.updated, now - 1000);
  assert.equal(data.rows[0].sent, now - 1000);
  assert.equal(data.rows[0].expires, now + 3600000);
});

test('malformed responses produce an error, valid empty collections are accepted, timestamps require offsets', () => {
  assert.throws(() => bulletins.readFeed({}, now));
  assert.throws(() => bulletins.readFeed(collection([{}]), now));
  assert.throws(() => bulletins.readFeed(collection([feature('unknown-time', { expires: '2026-11-20T12:00:00' })]), now));
  assert.deepEqual(bulletins.readFeed(collection([]), now).rows, []);
  assert.equal(bulletins.readFeed({ ...collection([]), updated: iso(86400000) }, now).updated, null);
});

test('NWS uses only documented area filters, escapes upstream text and retains the official link', () => {
  assert.equal(bulletins.urlFor('PR'), 'https://api.weather.gov/alerts/active?status=actual&limit=40&area=PR');
  assert.equal(bulletins.urlFor('xxx'), 'https://api.weather.gov/alerts/active?status=actual&limit=40');
  const input = feature('urn:oid:example', { description: '<b>Severe flooding</b>', instruction: 'Leave & seek help' });
  const row = bulletins.readFeed(collection([input]), now).rows[0];
  const html = bulletins.rowHtml(row, bulletins.messages.en, value => iso(value - now));
  assert.match(html, /&lt;b&gt;Severe flooding&lt;\/b&gt;/);
  assert.match(html, /Leave &amp; seek help/);
  assert.match(html, /https:\/\/api\.weather\.gov\/alerts\/urn%3Aoid%3Aexample/);
  assert.doesNotMatch(html, /<b>Severe flooding/);
});

test('every supported language supplies all feed controls and status text', () => {
  for (const [lang, copy] of Object.entries(bulletins.messages)) {
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(bulletins.messages.en).sort());
    const html = bulletins.render(lang);
    assert.ok(html.includes(copy.title));
    assert.ok(html.includes(copy.filter));
    assert.ok(html.includes(copy.loading));
    assert.ok(html.includes(copy.map));
    if (lang !== 'en') assert.notEqual(copy.failed, bulletins.messages.en.failed);
  }
});
