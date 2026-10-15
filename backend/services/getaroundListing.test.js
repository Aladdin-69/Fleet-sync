import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertGetaroundListingUrl,
  bookingWindow,
  parseGetaroundCalendar,
  unavailableRanges,
} from './getaroundListing.js';

const html = `
<div class="js_car_calendar" data-availabilities="{&quot;2026-10-17&quot;:[{&quot;time&quot;:&quot;am&quot;,&quot;availability&quot;:&quot;booked&quot;},{&quot;time&quot;:&quot;pm&quot;,&quot;availability&quot;:&quot;booked&quot;}],&quot;2026-10-18&quot;:[{&quot;time&quot;:&quot;am&quot;,&quot;availability&quot;:&quot;booked&quot;},{&quot;time&quot;:&quot;pm&quot;,&quot;availability&quot;:&quot;booked&quot;}],&quot;2026-10-19&quot;:[{&quot;time&quot;:&quot;am&quot;,&quot;availability&quot;:&quot;available&quot;},{&quot;time&quot;:&quot;pm&quot;,&quot;availability&quot;:&quot;available&quot;}],&quot;2026-10-25&quot;:[{&quot;time&quot;:&quot;am&quot;,&quot;availability&quot;:&quot;available&quot;},{&quot;time&quot;:&quot;pm&quot;,&quot;availability&quot;:&quot;booked&quot;}]}"></div>
`;

test('reads booked days from a Getaround listing calendar', () => {
  const ranges = unavailableRanges(parseGetaroundCalendar(html));
  assert.deepEqual(ranges, [
    { start: '2026-10-17', end: '2026-10-18', kind: 'full' },
    { start: '2026-10-25', end: '2026-10-25', kind: 'afternoon' },
  ]);
  assert.deepEqual(bookingWindow(ranges[0]), {
    start_date: '2026-10-17T00:00:00',
    end_date: '2026-10-18T23:59:00',
  });
  assert.deepEqual(bookingWindow(ranges[1]), {
    start_date: '2026-10-25T12:00:00',
    end_date: '2026-10-25T23:59:00',
  });
});

test('accepts only a public Getaround listing URL', () => {
  assert.equal(
    assertGetaroundListingUrl(' https://fr.getaround.com/location-voiture/ville/vehicule-1 '),
    'https://fr.getaround.com/location-voiture/ville/vehicule-1'
  );
  assert.throws(() => assertGetaroundListingUrl('http://fr.getaround.com/location-voiture/x'), /https/);
  assert.throws(() => assertGetaroundListingUrl('https://evil.example/location-voiture/x'), /https/);
  assert.throws(() => assertGetaroundListingUrl('https://169.254.169.254/latest/meta-data'), /https/);
});
