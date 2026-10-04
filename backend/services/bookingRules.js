export function rangesOverlap(startA, endA, startB, endB) {
  const a1 = new Date(startA).getTime();
  const a2 = new Date(endA).getTime();
  const b1 = new Date(startB).getTime();
  const b2 = new Date(endB).getTime();
  if ([a1, a2, b1, b2].some(Number.isNaN)) return false;
  return a1 < b2 && b1 < a2;
}

export function findConflicts(booking, others = []) {
  return others.filter((other) => {
    if (!other || other.id === booking.id) return false;
    if (other.vehicle_id !== booking.vehicle_id) return false;
    if (other.status === 'cancelled' || booking.status === 'cancelled') return false;
    return rangesOverlap(booking.start_date, booking.end_date, other.start_date, other.end_date);
  });
}

export const PLANS = {
  price_1Sx8RI8Ee6MCd5y0D8JX00qX: { name: 'Starter', type: 'starter' },
  price_1Sx8RI8Ee6MCd5y07dNgUwrv: { name: 'Growth', type: 'growth' },
  price_1Sx8RI8Ee6MCd5y0d6Cq9ekV: { name: 'Entreprise', type: 'enterprise' },
};

export function planFromPriceId(priceId) {
  return PLANS[priceId] || { name: 'Starter', type: 'starter' };
}
