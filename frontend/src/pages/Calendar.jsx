import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import BookingDetailModal from '@/components/calendar/BookingDetailModal';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

const platformColors = {
  turo: 'bg-purple-500',
  getaround: 'bg-cyan-500',
  hunos_rent: 'bg-orange-500',
  manual: 'bg-slate-500'
};

function CalendarContent() {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: allVehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list()
  });

  // Include archived vehicles for name lookup, but filter for selection
  const vehicles = allVehicles.filter(v => !v.archived);

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiClient.entities.Booking.list()
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });

  // Auto-update booking statuses based on dates
  useEffect(() => {
    const now = new Date();
    bookings.forEach(booking => {
      const startDate = parseISO(booking.start_date);
      const endDate = parseISO(booking.end_date);
      let newStatus = booking.status;

      if (booking.status === 'cancelled') return;

      if (isAfter(now, endDate)) {
        newStatus = 'completed';
      } else if (isWithinInterval(now, { start: startDate, end: endDate })) {
        newStatus = 'in_progress';
      } else if (isBefore(now, startDate) && booking.status !== 'pending') {
        newStatus = 'confirmed';
      }

      if (newStatus !== booking.status) {
        updateBookingMutation.mutate({ id: booking.id, data: { status: newStatus } });
      }
    });
  }, [bookings]);

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handleUpdateBooking = async (id, data) => {
    await updateBookingMutation.mutateAsync({ id, data });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for calendar alignment
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      if (selectedVehicle !== 'all' && booking.vehicle_id !== selectedVehicle) return false;
      return booking.status !== 'cancelled';
    });
  }, [bookings, selectedVehicle]);

  const getBookingsForDay = (day) => {
    return filteredBookings.filter(booking => {
      const start = parseISO(booking.start_date);
      const end = parseISO(booking.end_date);
      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
    });
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    return vehicle?.name || t('calendar.unknownVehicle');
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('calendar.title')}</h1>
            <p className="text-slate-500 mt-1">{t('calendar.subtitle')}</p>
          </div>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder={t('calendar.allVehicles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allVehicles')}</SelectItem>
              {vehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="min-h-24 p-2 bg-slate-50/50 border-b border-r border-slate-100" />
            ))}
            {days.map((day, index) => {
              const dayBookings = getBookingsForDay(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-24 p-2 border-b border-r border-slate-100 transition-colors",
                    !isSameMonth(day, currentMonth) && "bg-slate-50/50",
                    isCurrentDay && "bg-blue-50/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isCurrentDay ? "text-blue-600" : "text-slate-600"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => handleBookingClick(booking)}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded text-white truncate w-full text-left hover:opacity-80 transition-opacity",
                          platformColors[booking.platform] || 'bg-slate-500'
                        )}
                        title={`${getVehicleName(booking.vehicle_id)} - ${booking.guest_name || 'Guest'}`}
                      >
                        {getVehicleName(booking.vehicle_id)}
                      </button>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-slate-400 px-1">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 p-4 bg-white rounded-xl border border-slate-200">
          <span className="text-sm text-slate-500">{t('calendar.platforms')}:</span>
          {Object.entries(platformColors).map(([platform, color]) => (
            <div key={platform} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded", color)} />
              <span className="text-sm text-slate-600 capitalize">{platform.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        vehicle={selectedBooking ? vehicles.find(v => v.id === selectedBooking.vehicle_id) : null}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={handleUpdateBooking}
      />
    </div>
  );
}

export default function Calendar() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <CalendarContent />
    </ProtectedPageWrapper>
  );
}