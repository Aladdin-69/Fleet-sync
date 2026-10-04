import test from 'node:test';
import assert from 'node:assert/strict';
import { findConflicts, rangesOverlap } from './bookingRules.js';
import { matchVehicle, parseBookingEmail } from './emailParser.js';
import { suggestAlertRules } from './alertSuggestions.js';

test('ranges overlap when intervals intersect', () => {
  assert.equal(rangesOverlap('2026-04-01', '2026-04-05', '2026-04-04', '2026-04-08'), true);
  assert.equal(rangesOverlap('2026-04-01', '2026-04-05', '2026-04-05', '2026-04-08'), false);
});

test('parse a French booking email and match the vehicle', () => {
  const parsed = parseBookingEmail({
    subject: 'Réservation confirmée Turo',
    sender: 'noreply@turo.fr',
    body: `Véhicule: Peugeot 308
Immatriculation: AB-123-CD
Client: Marie Dupont
Du 01/04/2026 au 05/04/2026
Montant: 450€`,
  });

  assert.equal(parsed.platform_detected, 'turo');
  assert.equal(parsed.event_type, 'booking_confirmed');
  assert.equal(parsed.customer_name, 'Marie Dupont');
  assert.equal(parsed.license_plate, 'AB-123-CD');
  assert.equal(parsed.total_price, 450);
  assert.equal(parsed.start_date.slice(0, 10), '2026-04-01');
  assert.equal(parsed.end_date.slice(0, 10), '2026-04-05');

  const vehicle = matchVehicle(parsed, [
    { id: 'v1', name: 'Peugeot 308', license_plate: 'AB-123-CD' },
  ]);
  assert.equal(vehicle.id, 'v1');
});

test('conflicting bookings on the same vehicle are detected', () => {
  const booking = {
    id: 'b2',
    vehicle_id: 'v1',
    status: 'confirmed',
    start_date: '2026-04-03T00:00:00.000Z',
    end_date: '2026-04-06T00:00:00.000Z',
  };
  const conflicts = findConflicts(booking, [
    {
      id: 'b1',
      vehicle_id: 'v1',
      status: 'confirmed',
      platform: 'getaround',
      start_date: '2026-04-01T00:00:00.000Z',
      end_date: '2026-04-04T00:00:00.000Z',
    },
  ]);
  assert.equal(conflicts.length, 1);
});

test('alert suggestions follow the fleet data', () => {
  const suggestions = suggestAlertRules({
    vehicles: [{ id: 'v1', name: '308', platforms: ['turo', 'getaround'], archived: false }],
    bookings: [{ id: 'b1', vehicle_id: 'v1', total_price: 800, status: 'confirmed', start_date: '2026-05-01', end_date: '2026-05-04' }],
    emails: [],
    logs: [{ status: 'failed', platform: 'turo' }],
  });
  const types = suggestions.map((item) => item.condition_type);
  assert.ok(types.includes('multiple_platforms'));
  assert.ok(types.includes('high_value_booking'));
  assert.ok(types.includes('platform_mismatch'));
});
