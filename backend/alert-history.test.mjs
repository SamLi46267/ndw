import {test} from 'node:test';
import assert from 'node:assert/strict';
import {archiveWarnings, mergeQuakeRows} from './alert-history.mjs';
import {collect} from './collect.mjs';
import {usgsMonthEnd, usgsQuery, usgsRows} from './collect-history.mjs';
test('warning history retains every observed revision after all-clear and is repeatable', async () => {
  const route = '/alerts/v1/1.json';
  const original = { AlertID: 123, title: 'Flood warning' };
  const first = archiveWarnings({}, { [route]: { checkedAt: 10, data: [original] } });
  const changed = archiveWarnings(first, { [route]: { checkedAt: 20, data: [{ ...original, title: 'Updated flood warning' }] } });
  assert.equal(Object.keys(changed).length, 2);
  assert.deepEqual(archiveWarnings(changed, { [route]: { checkedAt: 30, data: [] } }), changed);
  assert.deepEqual(archiveWarnings(changed, { [route]: { checkedAt: 20, data: [{ ...original, title: 'Updated flood warning' }] } }), changed);
  const state = { pending: [{ key: '1' }], entries: { [route]: { data: [original], checkedAt: 10 } } };
  await collect(state, 'secret', async () => ({ ok: true, status: 200, json: async () => [] }), () => 40, async () => {});
  assert.equal(Object.values(state.alertHistory)[0].alert.AlertID, 123);
  assert.equal(state.entries[route].data.length, 0);
});
test('earthquake archive retains old events and merges updated IDs without time limits', () => {
  const old = [1, 10, 20, 3, 4, 'Old quake', 'earthquake'];
  const recent = [200, 30, 40, 3, 4, 'Recent quake', 'earthquake', 'us1'];
  const updated = [...recent]; updated[4] = 4.5;
  const rows = mergeQuakeRows([old, recent], [updated]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0][4], 4.5);
  assert.deepEqual(rows[1], old);
  assert.deepEqual(mergeQuakeRows(rows, [updated]), rows);
});

test('inclusive USGS month windows cover the final day and meet at one millisecond apart', () => {
  const feb = new Date('2024-02-01T00:00:00Z');
  const march = new Date('2024-03-01T00:00:00Z');
  const runTime = new Date('2024-03-12T13:14:15.123Z');
  const first = new URL(usgsQuery(feb, usgsMonthEnd(feb, runTime))).searchParams;
  const second = new URL(usgsQuery(march, usgsMonthEnd(march, runTime))).searchParams;
  assert.equal(first.get('endtime'), '2024-02-29T23:59:59.999Z');
  assert.equal(Date.parse(second.get('starttime')) - Date.parse(first.get('endtime')), 1);
  assert.equal(second.get('endtime'), runTime.toISOString());
});

test('USGS IDs supersede revised origins and retain other IDs at the same origin', () => {
  const legacy = [200, 10, 20, 3, 4, 'Original', 'earthquake'];
  const saved = [...legacy, 'us1'];
  const revised = [201, 10.1, 20, 4, 4, 'Revised', 'earthquake', 'us1'];
  const other = [...legacy, 'us2'];
  assert.deepEqual(mergeQuakeRows([legacy, saved], [revised, other]), [revised, other]);
  assert.deepEqual(mergeQuakeRows([saved], [legacy]), [saved]);
});

test('USGS archive retains valid zero coordinates and distinguishes missing measurements', () => {
  const event = (coordinates) => ({ geometry: { coordinates }, properties: { time: 123, mag: 3 } });
  const rows = usgsRows({ features: [event([0, 0]), event([2, null]), event([200, 10]), event([1, 2, 0])] });
  assert.deepEqual(rows.map(row => row.slice(1, 4)), [[0, 0, null], [1, 2, 0]]);
});
