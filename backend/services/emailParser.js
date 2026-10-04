const PLATFORMS = [
  { id: 'turo', domains: ['turo.com', 'turo.fr'] },
  { id: 'getaround', domains: ['getaround.com', 'getaround.fr'] },
  { id: 'hunos_rent', domains: ['hunos.com', 'hunosrent.com', 'hunos.fr'] },
];

function detectPlatform(sender = '', subject = '', body = '') {
  const haystack = `${sender} ${subject} ${body}`.toLowerCase();
  for (const platform of PLATFORMS) {
    if (platform.domains.some((domain) => haystack.includes(domain)) || haystack.includes(platform.id.replace('_', ' ')) || haystack.includes(platform.id)) {
      return platform.id;
    }
  }
  return 'unknown';
}

function detectEventType(subject = '', body = '') {
  const text = `${subject} ${body}`.toLowerCase();
  if (/annul|cancel/.test(text)) return 'booking_cancelled';
  if (/modif|chang|report/.test(text)) return 'booking_modified';
  if (/confirm|réserv|reserv|booking|nouvelle location/.test(text)) return 'booking_confirmed';
  return 'unknown';
}

function toIsoDate(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function extractDates(text) {
  const iso = text.match(/(\d{4}-\d{2}-\d{2})[\s\S]{0,40}?(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    return {
      start_date: new Date(`${iso[1]}T00:00:00.000Z`).toISOString(),
      end_date: new Date(`${iso[2]}T00:00:00.000Z`).toISOString(),
    };
  }

  const french = text.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})[\s\S]{0,40}?(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (french) {
    return {
      start_date: toIsoDate(french[3], french[2], french[1]),
      end_date: toIsoDate(french[6], french[5], french[4]),
    };
  }

  return { start_date: null, end_date: null };
}

function field(text, labels) {
  const pattern = new RegExp(`(?:${labels.join('|')})\\s*[:\\-]\\s*(.+)`, 'i');
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

export function parseBookingEmail({ subject = '', sender = '', body = '' } = {}) {
  const text = `${subject}\n${body}`;
  const dates = extractDates(text);
  const priceMatch = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur)/i);
  const plate = field(text, ['immatriculation', 'plaque', 'license plate', 'licence plate'])
    || (text.match(/\b([A-Z]{2}-?\d{3}-?[A-Z]{2})\b/) || [])[1]
    || null;

  return {
    platform_detected: detectPlatform(sender, subject, body),
    event_type: detectEventType(subject, body),
    start_date: dates.start_date,
    end_date: dates.end_date,
    customer_name: field(text, ['client', 'guest', 'voyageur', 'locataire']),
    vehicle_name: field(text, ['véhicule', 'vehicule', 'vehicle', 'voiture']),
    license_plate: plate ? plate.toUpperCase() : null,
    total_price: priceMatch ? Number(priceMatch[1].replace(',', '.')) : null,
  };
}

export function matchVehicle(parsed, vehicles = []) {
  const plate = parsed.license_plate?.replace(/[^A-Z0-9]/g, '');
  if (plate) {
    const byPlate = vehicles.find((vehicle) => (
      (vehicle.license_plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === plate
    ));
    if (byPlate) return byPlate;
  }

  if (parsed.vehicle_name) {
    const needle = parsed.vehicle_name.toLowerCase();
    return vehicles.find((vehicle) => (vehicle.name || '').toLowerCase().includes(needle)
      || needle.includes((vehicle.name || '').toLowerCase())) || null;
  }

  return null;
}
