import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch historical data
    const emailActivities = await base44.entities.EmailActivity.list('-received_at', 500);
    const bookings = await base44.entities.Booking.list();
    const automationLogs = await base44.entities.AutomationLog.list('-executed_at', 500);
    const vehicles = await base44.entities.Vehicle.list();

    const suggestions = [];

    // Analyze duplicate bookings pattern
    const vehicleDateMap = {};
    emailActivities.forEach(activity => {
      if (activity.vehicle_matched && activity.event_type === 'booking_confirmed') {
        const key = `${activity.vehicle_matched}_${activity.received_at?.split('T')[0]}`;
        vehicleDateMap[key] = (vehicleDateMap[key] || 0) + 1;
      }
    });

    const duplicateCount = Object.values(vehicleDateMap).filter(count => count > 1).length;
    if (duplicateCount > 0) {
      suggestions.push({
        condition_type: 'duplicate_bookings',
        name: 'Alerter sur réservations dupliquées',
        condition_params: {
          time_window_hours: 24,
          vehicles: []
        },
        severity: 'critical',
        confidence_score: Math.min(90, 50 + duplicateCount * 5)
      });
    }

    // Analyze late cancellation patterns
    const lateRejections = emailActivities.filter(activity => {
      if (activity.event_type !== 'booking_cancelled') return false;
      const booking = bookings.find(b => b.id === activity.vehicle_matched);
      if (!booking) return false;
      
      const cancelDate = new Date(activity.received_at);
      const bookingDate = new Date(booking.start_date);
      const daysBeforeBooking = Math.floor((bookingDate - cancelDate) / (1000 * 60 * 60 * 24));
      return daysBeforeBooking < 2;
    });

    if (lateRejections.length > 5) {
      suggestions.push({
        condition_type: 'late_cancellation',
        name: 'Alerter sur annulations tardives',
        condition_params: {
          min_days_before_booking: 2,
          vehicles: []
        },
        severity: 'warning',
        confidence_score: Math.min(85, 50 + lateRejections.length * 3)
      });
    }

    // Analyze automation errors by platform
    const errorsByPlatform = {};
    automationLogs.forEach(log => {
      if (log.status === 'failed') {
        errorsByPlatform[log.platform] = (errorsByPlatform[log.platform] || 0) + 1;
      }
    });

    Object.entries(errorsByPlatform).forEach(([platform, count]) => {
      if (count > 3) {
        suggestions.push({
          condition_type: 'platform_mismatch',
          name: `Alerter sur erreurs ${platform}`,
          condition_params: {
            platforms: [platform]
          },
          severity: count > 10 ? 'critical' : 'warning',
          confidence_score: Math.min(80, 50 + Math.min(count * 5, 30))
        });
      }
    });

    // Analyze high-value bookings
    const highValueBookings = bookings.filter(b => {
      const revenue = emailActivities.find(e => e.vehicle_matched === b.vehicle_id)?.classified_output;
      return revenue && JSON.parse(revenue)?.estimated_value > 500;
    });

    if (highValueBookings.length > 2) {
      suggestions.push({
        condition_type: 'high_value_booking',
        name: 'Alerter sur réservations haute valeur',
        condition_params: {
          min_amount: 500
        },
        severity: 'warning',
        confidence_score: 75
      });
    }

    // Analyze vehicles on multiple platforms
    const multiPlatformVehicles = vehicles.filter(v => v.platforms?.length > 1);
    if (multiPlatformVehicles.length > 0) {
      const conflictCount = emailActivities.filter(e => {
        const vehicle = vehicles.find(v => v.id === e.vehicle_matched);
        return vehicle?.platforms?.length > 1 && e.event_type === 'booking_confirmed';
      }).length;

      if (conflictCount > 3) {
        suggestions.push({
          condition_type: 'multiple_platforms',
          name: 'Alerter sur conflits multi-plateforme',
          condition_params: {
            vehicles: multiPlatformVehicles.map(v => v.id)
          },
          severity: 'critical',
          confidence_score: Math.min(85, 50 + conflictCount * 3)
        });
      }
    }

    // Use LLM to refine suggestions
    if (suggestions.length > 0) {
      const summaryText = `Basé sur ${emailActivities.length} emails, ${automationLogs.length} automations et ${bookings.length} réservations, voici les règles d'alerte suggérées. Les données montrent ${duplicateCount} jours avec doublons, ${lateRejections.length} annulations tardives, et ${multiPlatformVehicles.length} véhicules multi-plateforme.`;
      
      const refinement = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un expert en gestion de flotte de location de voitures. ${summaryText}. Classe les suggestions d'alerte par importance et efficacité. Réponds en JSON avec un tableau "refined_ranking" contenant les indices des suggestions par ordre de priorité.`,
        response_json_schema: {
          type: 'object',
          properties: {
            refined_ranking: {
              type: 'array',
              items: { type: 'number' }
            }
          }
        }
      });

      // Reorder suggestions based on AI ranking
      if (refinement?.refined_ranking) {
        const ranked = [];
        refinement.refined_ranking.forEach(idx => {
          if (suggestions[idx]) ranked.push(suggestions[idx]);
        });
        return Response.json({ suggestions: ranked.length > 0 ? ranked : suggestions });
      }
    }

    return Response.json({ suggestions });
  } catch (error) {
    console.error('Suggestion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});