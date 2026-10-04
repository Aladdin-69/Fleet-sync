import { useState } from 'react';
import { Car, Calendar, CheckCircle2, Clock, ExternalLink, User, Hash, ChevronDown, Pencil, Trash2, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns';
import { useLanguage } from '@/components/LanguageProvider';

const platformBadges = {
  turo: { label: 'Turo', color: 'bg-slate-900 text-white border-slate-900' },
  getaround: { label: 'Getaround', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  hunos_rent: { label: 'Hunos Rent', color: 'bg-green-100 text-green-700 border-green-200' }
};

export default function VehicleCard({ vehicle, currentBooking, onClick, onEdit, onDelete, onArchive }) {
  const { t } = useLanguage();
  
  const statusConfig = {
    available: { label: t('vehicles.available'), color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    booked: { label: t('vehicles.booked'), color: 'bg-blue-500', textColor: 'text-blue-600' },
    maintenance: { label: t('vehicles.maintenance'), color: 'bg-amber-500', textColor: 'text-amber-600' }
  };
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const status = statusConfig[vehicle.status] || statusConfig.available;
  
  const getBookingDuration = () => {
    if (!currentBooking) return null;
    const start = parseISO(currentBooking.start_date);
    const end = parseISO(currentBooking.end_date);
    const days = differenceInDays(end, start);
    const hours = differenceInHours(end, start) % 24;
    
    if (days > 0) {
      return `${days} ${days !== 1 ? t('vehicles.days') : t('vehicles.day')}${hours > 0 ? ` ${hours}h` : ''}`;
    }
    return `${hours} ${hours !== 1 ? t('vehicles.hours') : t('vehicles.hour')}`;
  };
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 cursor-pointer group"
    >
      {/* Vehicle Image */}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
        {vehicle.image_url ? (
          <img 
            src={vehicle.image_url} 
            alt={vehicle.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-slate-300" />
          </div>
        )}
        
        {/* Status indicator */}
        <div className="absolute top-3 left-3">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm shadow-sm",
            status.textColor
          )}>
            <span className={cn("w-2 h-2 rounded-full", status.color)} />
            {status.label}
          </div>
        </div>

        {/* Edit, Archive and Delete buttons */}
        {(onEdit || onArchive || onDelete) && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            {onEdit && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(vehicle);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {onArchive && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 hover:bg-white shadow-md hover:bg-amber-50 hover:text-amber-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(vehicle);
                }}
              >
                <Archive className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 hover:bg-white shadow-md hover:bg-red-50 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(vehicle);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        
        {/* Calendar status */}
        {vehicle.calendar_provider && vehicle.calendar_provider !== 'none' && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-xs text-slate-600">
              <Calendar className="w-3 h-3" />
              <span className="capitalize">{vehicle.calendar_provider}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Vehicle Info */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-slate-900 truncate">{vehicle.name}</h3>
        
        {(vehicle.year || vehicle.make || vehicle.model) && (
          <p className="text-sm text-slate-500 mt-0.5">
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
          </p>
        )}
        
        {vehicle.license_plate && (
          <p className="text-xs text-slate-400 mt-1 font-mono">{vehicle.license_plate}</p>
        )}
        
        {/* Platforms */}
        <div className="flex flex-wrap gap-2 mt-4">
          {vehicle.platforms?.map((platform) => {
            const badge = platformBadges[platform];
            return badge ? (
              <span 
                key={platform}
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-lg border",
                  badge.color
                )}
              >
                {badge.label}
              </span>
            ) : null;
          })}
        </div>
        
        {/* Current booking details */}
        {vehicle.status === 'booked' && currentBooking && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBookingDetails(!showBookingDetails);
              }}
              className="flex items-center justify-between w-full text-left hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">{t('vehicles.activeBooking')}</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-slate-400 transition-transform",
                showBookingDetails && "rotate-180"
              )} />
            </button>
            
            {showBookingDetails && (
              <div className="mt-3 space-y-2 text-sm bg-slate-50 rounded-lg p-3">
                {currentBooking.guest_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{t('vehicles.guest')}</span>
                    <span className="font-medium text-slate-800">{currentBooking.guest_name}</span>
                  </div>
                )}
                {currentBooking.booking_reference && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{t('vehicles.ref')}</span>
                    <span className="font-mono text-xs text-slate-800">{currentBooking.booking_reference}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-slate-600 mb-1">{t('vehicles.checkIn')}</div>
                    <div className="font-medium text-slate-800">
                      {format(parseISO(currentBooking.start_date), 'MMM d, yyyy · HH:mm')}
                    </div>
                    <div className="text-slate-600 mt-2 mb-1">{t('vehicles.checkOut')}</div>
                    <div className="font-medium text-slate-800">
                      {format(parseISO(currentBooking.end_date), 'MMM d, yyyy · HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{t('vehicles.duration')}</span>
                  <span className="font-medium text-slate-800">{getBookingDuration()}</span>
                </div>
                {vehicle.current_booking_source && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-md capitalize inline-block",
                      platformBadges[vehicle.current_booking_source]?.color || "bg-slate-100 text-slate-700"
                    )}>
                      {t('vehicles.via')} {vehicle.current_booking_source}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}