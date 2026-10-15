const LISTING_HOSTS = new Set(['fr.getaround.com', 'getaround.com', 'www.getaround.com']);

export function assertGetaroundListingUrl(value) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch {
    const error = new Error('Le lien Getaround est invalide');
    error.status = 400;
    throw error;
  }
  if (url.protocol !== 'https:' || !LISTING_HOSTS.has(url.hostname)) {
    const error = new Error('Le lien doit être une annonce https://fr.getaround.com');
    error.status = 400;
    throw error;
  }
  return url.toString();
}

export function parseGetaroundCalendar(html) {
  const match = String(html).match(/data-availabilities="([\s\S]*?)"/);
  if (!match) {
    const error = new Error('Cette annonce ne contient pas de calendrier de disponibilités');
    error.status = 422;
    throw error;
  }
  const decoded = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
  let calendar;
  try {
    calendar = JSON.parse(decoded);
  } catch {
    const error = new Error('Le calendrier de l’annonce est illisible');
    error.status = 422;
    throw error;
  }
  return Object.entries(calendar)
    .map(([day, slots]) => ({ day, slots: Array.isArray(slots) ? slots : [] }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function dayKind(slots) {
  const am = slots.find((slot) => slot.time === 'am')?.availability;
  const pm = slots.find((slot) => slot.time === 'pm')?.availability;
  if (am === 'booked' && pm === 'booked') return 'full';
  if (am === 'booked') return 'morning';
  if (pm === 'booked') return 'afternoon';
  return null;
}

function nextDay(isoDay) {
  const date = new Date(`${isoDay}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function unavailableRanges(days) {
  const ranges = [];
  let open = null;

  const close = () => {
    if (!open) return;
    ranges.push(open);
    open = null;
  };

  for (const entry of days) {
    const kind = dayKind(entry.slots);
    if (kind === 'full' && open?.kind === 'full' && nextDay(open.end) === entry.day) {
      open.end = entry.day;
      continue;
    }
    close();
    if (kind) open = { start: entry.day, end: entry.day, kind };
  }
  close();
  return ranges;
}

// Wall-clock times, without a timezone suffix, so the FleetSync calendar
// (which compares local days) shows the listing day and not the next morning.
export function bookingWindow(range) {
  if (range.kind === 'morning') {
    return {
      start_date: `${range.start}T00:00:00`,
      end_date: `${range.start}T12:00:00`,
    };
  }
  if (range.kind === 'afternoon') {
    return {
      start_date: `${range.start}T12:00:00`,
      end_date: `${range.start}T23:59:00`,
    };
  }
  return {
    start_date: `${range.start}T00:00:00`,
    end_date: `${range.end}T23:59:00`,
  };
}

export async function fetchListingHtml(listingUrl, fetchImpl = fetch) {
  const url = assertGetaroundListingUrl(listingUrl);
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'FleetSync/1.0 (public listing availability)',
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    const error = new Error('Impossible de joindre l’annonce Getaround');
    error.status = 422;
    throw error;
  }

  if (response.status >= 300 && response.status < 400) {
    const error = new Error('L’annonce Getaround a renvoyé une redirection, lecture annulée');
    error.status = 422;
    throw error;
  }
  if (!response.ok) {
    const error = new Error('Impossible de lire cette annonce Getaround');
    error.status = 422;
    throw error;
  }

  const html = await response.text();
  if (html.length > 2_000_000) {
    const error = new Error('La page Getaround est trop volumineuse');
    error.status = 422;
    throw error;
  }
  return html;
}
