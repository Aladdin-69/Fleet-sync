export function vehiclePortraitDataUrl({ year, make, model } = {}) {
  const title = [year, make, model].filter(Boolean).join(' ') || 'Véhicule';
  const safeTitle = String(title).replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#0f172a"/>
  <rect x="70" y="210" width="660" height="150" rx="28" fill="#1e293b"/>
  <circle cx="230" cy="370" r="42" fill="#334155"/>
  <circle cx="570" cy="370" r="42" fill="#334155"/>
  <path d="M160 250 L230 160 H520 L650 250" fill="none" stroke="#38bdf8" stroke-width="10"/>
  <text x="400" y="450" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="28">${safeTitle}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function decodeVin(vin) {
  const clean = String(vin || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length !== 17) {
    const error = new Error('Un VIN doit contenir 17 caractères');
    error.status = 400;
    throw error;
  }

  const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(clean)}?format=json`);
  if (!response.ok) {
    const error = new Error('Le service public NHTSA est indisponible');
    error.status = 502;
    throw error;
  }

  const payload = await response.json();
  const row = payload?.Results?.[0] || {};
  const year = Number(row.ModelYear) || null;
  const make = row.Make || null;
  const model = row.Model || null;
  if (!year && !make && !model) {
    const error = new Error('Aucun véhicule trouvé pour ce VIN');
    error.status = 404;
    throw error;
  }

  return { year, make, model, image_url: vehiclePortraitDataUrl({ year, make, model }) };
}
