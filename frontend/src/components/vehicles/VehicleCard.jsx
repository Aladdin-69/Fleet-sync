import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Car, Calendar, CheckCircle2, Clock, ExternalLink, User, Hash, ChevronDown, Pencil, Trash2, Archive, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { useLanguage } from '@/components/LanguageProvider';

const platformBadges = {
  turo: { label: 'Turo', color: 'bg-slate-900 text-white border-slate-900' },
  getaround: { label: 'Getaround', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  hunos_rent: { label: 'Hunos Rent', color: 'bg-green-100 text-green-700 border-green-200' }
};

function listingBlockLabel(block) {
  const kind = block.kind === 'morning' ? 'matin' : block.kind === 'afternoon' ? 'après-midi' : 'journée';
  const start = format(parseISO(block.start), 'd MMM', { locale: fr });
  if (block.start === block.end) return `${start} (${kind})`;
  const end = format(parseISO(block.end), 'd MMM', { locale: fr });
  return `${start} → ${end} (${kind})`;
}

export default function VehicleCard({ vehicle, currentBooking, onClick, onEdit, onDelete, onArchive }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [readingListing, setReadingListing] = useState(false);
  
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
        
        {vehicle.getaround_listing_url && (
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-700">Annonce Getaround</p>
              <a
                href={vehicle.getaround_listing_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {vehicle.listing_read_at && (
              <p className="text-xs text-slate-500 mt-1">
                Lue le {format(parseISO(vehicle.listing_read_at), 'd MMM yyyy · HH:mm', { locale: fr })}
              </p>
            )}
            {vehicle.listing_blocks?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {vehicle.listing_blocks.slice(0, 4).map((block) => (
                  <li key={`${block.start}-${block.end}-${block.kind}`} className="text-xs text-slate-600">
                    {listingBlockLabel(block)}
                  </li>
                ))}
                {vehicle.listing_blocks.length > 4 && (
                  <li className="text-xs text-slate-400">+ {vehicle.listing_blocks.length - 4} autre(s) période(s)</li>
                )}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              disabled={readingListing}
              onClick={async () => {
                setReadingListing(true);
                try {
                  const response = await apiClient.functions.invoke('readGetaroundListing', { vehicle_id: vehicle.id });
                  queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                  queryClient.invalidateQueries({ queryKey: ['bookings'] });
                  toast.success(response.data?.summary || 'Dates indisponibles mises à jour');
                } catch (error) {
                  toast.error(error.message || 'Lecture de l’annonce impossible');
                } finally {
                  setReadingListing(false);
                }
              }}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-2', readingListing && 'animate-spin')} />
              {readingListing ? 'Lecture...' : 'Lire les dates indisponibles'}
            </Button>
          </div>
        )}

        {vehicle.platforms?.some((platform) => platform === 'turo' || platform === 'getaround') && (
          <p className="mt-4 text-xs text-slate-500">
            Turo France et Getaround France ne prennent pas d’iCal. FleetSync prépare le blocage, il reste à le saisir dans leur calendrier.
          </p>
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