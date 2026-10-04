function daysBetween(later, earlier) {
  return Math.floor((new Date(later) - new Date(earlier)) / (1000 * 60 * 60 * 24));
}

export function suggestAlertRules({ emails = [], bookings = [], logs = [], vehicles = [] } = {}) {
  const suggestions = [];

  const vehicleDateMap = {};
  emails.forEach((activity) => {
    if (activity.vehicle_matched && activity.event_type === 'booking_confirmed') {
      const day = String(activity.received_at || '').split('T')[0];
      const key = `${activity.vehicle_matched}_${day}`;
      vehicleDateMap[key] = (vehicleDateMap[key] || 0) + 1;
    }
  });

  const duplicateCount = Object.values(vehicleDateMap).filter((count) => count > 1).length;
  const overlappingBookings = bookings.filter((booking, index) => (
    bookings.some((other, otherIndex) => (
      otherIndex > index
      && other.vehicle_id === booking.vehicle_id
      && other.status !== 'cancelled'
      && booking.status !== 'cancelled'
      && new Date(booking.start_date) < new Date(other.end_date)
      && new Date(other.start_date) < new Date(booking.end_date)
    ))
  ));

  if (duplicateCount > 0 || overlappingBookings.length > 0) {
    const signal = duplicateCount + overlappingBookings.length;
    suggestions.push({
      condition_type: 'duplicate_bookings',
      name: 'Alerter sur réservations dupliquées',
      condition_params: { time_window_hours: 24, vehicles: [] },
      severity: 'critical',
      confidence_score: Math.min(90, 50 + signal * 5),
    });
  }

  const lateCancellations = emails.filter((activity) => {
    if (activity.event_type !== 'booking_cancelled') return false;
    const booking = bookings.find((item) => item.id === activity.booking_id || item.vehicle_id === activity.vehicle_matched);
    if (!booking?.start_date || !activity.received_at) return false;
    return daysBetween(booking.start_date, activity.received_at) < 2;
  });

  if (lateCancellations.length > 0) {
    suggestions.push({
      condition_type: 'late_cancellation',
      name: 'Alerter sur annulations tardives',
      condition_params: { min_days_before_booking: 2, vehicles: [] },
      severity: 'warning',
      confidence_score: Math.min(85, 55 + lateCancellations.length * 5),
    });
  }

  const errorsByPlatform = {};
  logs.forEach((log) => {
    if (log.status === 'failed' && log.platform) {
      errorsByPlatform[log.platform] = (errorsByPlatform[log.platform] || 0) + 1;
    }
  });

  Object.entries(errorsByPlatform).forEach(([platform, count]) => {
    if (count > 0) {
      suggestions.push({
        condition_type: 'platform_mismatch',
        name: `Alerter sur erreurs ${platform}`,
        condition_params: { platforms: [platform] },
        severity: count > 3 ? 'critical' : 'warning',
        confidence_score: Math.min(80, 50 + Math.min(count * 5, 30)),
      });
    }
  });

  const highValue = bookings.filter((booking) => Number(booking.total_price) >= 500 && booking.status !== 'cancelled');
  if (highValue.length > 0) {
    suggestions.push({
      condition_type: 'high_value_booking',
      name: 'Alerter sur réservations haute valeur',
      condition_params: { min_amount: 500 },
      severity: 'warning',
      confidence_score: 75,
    });
  }

  const multiPlatform = vehicles.filter((vehicle) => Array.isArray(vehicle.platforms) && vehicle.platforms.length > 1 && !vehicle.archived);
  if (multiPlatform.length > 0) {
    suggestions.push({
      condition_type: 'multiple_platforms',
      name: 'Alerter sur véhicules multi-plateformes',
      condition_params: { vehicles: multiPlatform.map((vehicle) => vehicle.id) },
      severity: 'warning',
      confidence_score: Math.min(88, 60 + multiPlatform.length * 4),
    });
  }

  return suggestions;
}
