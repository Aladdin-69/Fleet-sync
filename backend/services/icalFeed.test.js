import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingsForConsumer, buildIcalFeed } from './icalFeed.js';

const bookings = [
  {
    id: 'b-turo',
    platform: 'turo',
    status: 'confirmed',
    start_date: '2026-04-01T00:00:00.000Z',
    end_date: '2026-04-05T00:00:00.000Z',
  },
  {
    id: 'b-getaround',
    platform: 'getaround',
    status: 'confirmed',
    start_date: '2026-05-10T00:00:00.000Z',
    end_date: '2026-05-12T00:00:00.000Z',
  },
  {
    id: 'b-cancelled',
    platform: 'turo',
    status: 'cancelled',
    start_date: '2026-06-01T00:00:00.000Z',
    end_date: '2026-06-03T00:00:00.000Z',
  },
];

test('a Turo booking is published to Getaround and hidden from the Turo feed', () => {
  const forGetaround = bookingsForConsumer(bookings, 'getaround');
  const forTuro = bookingsForConsumer(bookings, 'turo');

  assert.deepEqual(forGetaround.map((item) => item.id), ['b-turo']);
  assert.deepEqual(forTuro.map((item) => item.id), ['b-getaround']);
});

test('the ics feed blocks the other platform for the whole rental', () => {
  const ics = buildIcalFeed({
    vehicleName: 'Peugeot 308',
    consumerPlatform: 'getaround',
    bookings,
  });

  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /UID:fleetsync-b-turo@fleetsync/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260401/);
  assert.match(ics, /DTEND;VALUE=DATE:20260406/);
  assert.doesNotMatch(ics, /fleetsync-b-getaround/);
  assert.doesNotMatch(ics, /fleetsync-b-cancelled/);
});
