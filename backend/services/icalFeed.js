const PLATFORM_LABELS = {
  turo: 'Turo',
  getaround: 'Getaround',
  hunos_rent: 'Hunos Rent',
  manual: 'FleetSync',
  unknown: 'FleetSync',
};

export function bookingsForConsumer(bookings, consumerPlatform) {
  return bookings.filter((booking) => (
    booking
    && booking.status !== 'cancelled'
    && booking.platform !== consumerPlatform
    && booking.start_date
    && booking.end_date
  ));
}

function utcStamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function dateStamp(iso, extraDays = 0) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + extraDays);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildIcalFeed({ vehicleName, consumerPlatform, bookings }) {
  const label = PLATFORM_LABELS[consumerPlatform] || consumerPlatform;
  const events = bookingsForConsumer(bookings, consumerPlatform).map((booking) => {
    const source = PLATFORM_LABELS[booking.platform] || booking.platform || 'FleetSync';
    return [
      'BEGIN:VEVENT',
      `UID:fleetsync-${booking.id}@fleetsync`,
      `DTSTAMP:${utcStamp()}`,
      `DTSTART;VALUE=DATE:${dateStamp(booking.start_date)}`,
      `DTEND;VALUE=DATE:${dateStamp(booking.end_date, 1)}`,
      `SUMMARY:${escapeText(`Indisponible (${source})`)}`,
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FleetSync//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(`${vehicleName || 'Véhicule'} vers ${label}`)}`,
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function feedPath(token, platform) {
  return `/api/calendar/feed/${token}/${platform}.ics`;
}
