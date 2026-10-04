import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Plus, Search, Filter, RefreshCw, Archive, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VehicleCard from '@/components/vehicles/VehicleCard';
import AddVehicleModal from '@/components/vehicles/AddVehicleModal';
import EditVehicleModal from '@/components/vehicles/EditVehicleModal';
import UpgradePlanModal from '@/components/subscription/UpgradePlanModal';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

function VehiclesContent() {
  const { t, language } = useLanguage();
const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [calendarFilter, setCalendarFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  // Plans de tarification
  const plans = [
    { id: 'starter', maxVehicles: 2, basePrice: 19.99, pricePerVehicle: 0, fixedPrice: true },
    { id: 'growth', maxVehicles: 7, basePrice: 39.99, pricePerVehicle: 0, fixedPrice: true },
    { id: 'enterprise', maxVehicles: Infinity, basePrice: 79.99, pricePerVehicle: 0, fixedPrice: true }
  ];

  // Plan actuel de l'utilisateur (à récupérer depuis les paramètres utilisateur)
  const [currentPlan] = useState('starter'); // Par défaut Starter
  const getCurrentPlan = () => plans.find(p => p.id === currentPlan) || plans[0];

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list()
  });

  // Véhicules actifs (non archivés)
  const activeVehicles = vehicles.filter(v => !v.archived);

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiClient.entities.Booking.filter({ status: 'confirmed' })
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Vehicle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowAddModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Vehicle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowEditModal(false);
      setEditingVehicle(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Vehicle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('vehicles.deleteSuccess'));
    }
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }) => apiClient.entities.Vehicle.update(id, { archived }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(variables.archived ? t('vehicles.archiveSuccess') : t('vehicles.unarchiveSuccess'));
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  const handleSyncToGoogleCalendar = async () => {
    try {
      setIsSyncingCalendar(true);
      toast.loading('Synchronisation avec Google Calendar...', { id: 'calendar-sync' });

      const { data } = await apiClient.functions.invoke('syncBookingsToGoogleCalendar');

      toast.success('Synchronisation réussie', {
        id: 'calendar-sync',
        description: `${data.synced}/${data.total} réservations synchronisées`
      });

      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    } catch (error) {
      toast.error('Erreur de synchronisation', {
        id: 'calendar-sync',
        description: error.message
      });
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleAutoSync = async () => {
    try {
      setIsSyncing(true);
      
      // Vérifier le nombre de synchronisations aujourd'hui
      const { data: syncStatus } = await apiClient.entities.SyncStatus.list();
      const todaySyncs = syncStatus?.[0]?.emails_processed_today || 0;
      
      if (todaySyncs >= 3) {
        toast.error(t('vehicles.syncLimitReached'), {
          description: t('vehicles.syncLimitDesc')
        });
        return;
      }

      toast.loading(t('vehicles.syncing'), { id: 'sync' });

      // Appeler l'intégration pour lire les emails
      const result = await apiClient.integrations.Core.InvokeLLM({
        prompt: 'Analyse les derniers emails de réservation (Turo, Getaround, Hunos Rent) et crée/met à jour les réservations dans le système. Retourne un résumé des actions effectuées.',
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            emails_processed: { type: 'number' },
            bookings_created: { type: 'number' },
            bookings_updated: { type: 'number' },
            summary: { type: 'string' }
          }
        }
      });

      // Mettre à jour le statut de synchronisation
      if (syncStatus?.[0]?.id) {
        await apiClient.entities.SyncStatus.update(syncStatus[0].id, {
          last_email_processed: new Date().toISOString(),
          emails_processed_today: todaySyncs + 1
        });
      }

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['email-activities'] });

      toast.success(t('vehicles.syncSuccess'), {
        id: 'sync',
        description: result.summary || t('vehicles.emailsProcessed', { count: result.emails_processed || 0 })
      });
    } catch (error) {
      toast.error(t('vehicles.syncError'), {
        id: 'sync',
        description: error.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleDeleteVehicle = (vehicle) => {
    if (window.confirm(t('vehicles.confirmDelete', { name: vehicle.name }))) {
      deleteMutation.mutate(vehicle.id);
    }
  };

  const handleArchiveVehicle = (vehicle) => {
    const action = vehicle.archived ? t('vehicles.unarchive') : t('vehicles.archive');
    if (window.confirm(t('vehicles.confirmArchive', { action, name: vehicle.name }))) {
      archiveMutation.mutate({ id: vehicle.id, archived: !vehicle.archived });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || vehicle.platforms?.includes(platformFilter);
    const matchesCalendar = calendarFilter === 'all' || vehicle.calendar_provider === calendarFilter;
    const matchesArchived = showArchived ? vehicle.archived : !vehicle.archived;
    return matchesSearch && matchesStatus && matchesPlatform && matchesCalendar && matchesArchived;
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('vehicles.title')}</h1>
            <p className="text-slate-500 mt-1">{t('vehicles.subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              onClick={handleSyncToGoogleCalendar} 
              variant="outline"
              disabled={isSyncingCalendar}
              className="gap-2 whitespace-nowrap"
            >
              <Calendar className={`w-4 h-4 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Synchroniser Google Calendar</span>
              <span className="sm:hidden">Google Calendar</span>
            </Button>
            <Button 
              onClick={handleAutoSync} 
              variant="outline"
              disabled={isSyncing}
              className="gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('vehicles.autoSync')}</span>
              <span className="sm:hidden">{t('vehicles.autoSyncShort')}</span>
            </Button>
            <Button 
              onClick={() => {
                const plan = getCurrentPlan();
                if (activeVehicles.length >= plan.maxVehicles) {
                  setShowUpgradeModal(true);
                } else {
                  setShowAddModal(true);
                }
              }} 
              className="gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {t('vehicles.addVehicle')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">{t('vehicles.advancedFilters')}</h3>
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="ml-auto text-xs h-7 gap-1.5"
            >
              <Archive className="w-3 h-3" />
              {showArchived ? t('vehicles.archived') : t('vehicles.viewArchived')}
            </Button>
            {(searchQuery || statusFilter !== 'all' || platformFilter !== 'all' || calendarFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPlatformFilter('all');
                  setCalendarFilter('all');
                }}
                className="text-xs h-7"
              >
                {t('vehicles.reset')}
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('vehicles.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicles.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('vehicles.allStatus')}</SelectItem>
                  <SelectItem value="available">{t('vehicles.available')}</SelectItem>
                  <SelectItem value="booked">{t('vehicles.booked')}</SelectItem>
                  <SelectItem value="maintenance">{t('vehicles.maintenance')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicles.platform')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('vehicles.allPlatforms')}</SelectItem>
                  <SelectItem value="turo">Turo</SelectItem>
                  <SelectItem value="getaround">Getaround</SelectItem>
                  <SelectItem value="hunos_rent">Hunos Rent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicles.calendar')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('vehicles.allCalendars')}</SelectItem>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="outlook">Outlook</SelectItem>
                  <SelectItem value="none">{t('vehicles.noCalendar')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Summary */}
            {filteredVehicles.length !== vehicles.length && vehicles.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t">
                <span className="font-medium">{filteredVehicles.length}</span>
                <span>{t('vehicles.vehiclesCount', { filtered: filteredVehicles.length, total: vehicles.length })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-72 animate-pulse">
                <div className="h-44 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const currentBooking = bookings.find(b => b.vehicle_id === vehicle.id && vehicle.status === 'booked');
              return (
                <VehicleCard 
                  key={vehicle.id} 
                  vehicle={vehicle} 
                  currentBooking={currentBooking}
                  onEdit={handleEditVehicle}
                  onArchive={handleArchiveVehicle}
                  onDelete={handleDeleteVehicle}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{t('vehicles.noVehicles')}</h3>
            <p className="text-slate-500 mt-1">
              {vehicles.length === 0 
                ? t('vehicles.noVehiclesDesc')
                : t('vehicles.adjustFilters')}
            </p>
            {vehicles.length === 0 && (
              <Button onClick={() => setShowAddModal(true)} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                {t('vehicles.addVehicle')}
              </Button>
            )}
          </div>
        )}
      </div>

      <AddVehicleModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={createMutation.mutate}
        isLoading={createMutation.isPending}
      />

      <EditVehicleModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingVehicle(null);
        }}
        vehicle={editingVehicle}
        onSave={(data) => updateMutation.mutate({ id: editingVehicle.id, data })}
        isLoading={updateMutation.isPending}
      />

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentVehicles={activeVehicles.length}
        currentPlan={currentPlan}
      />
    </div>
  );
}

export default function Vehicles() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <VehiclesContent />
    </ProtectedPageWrapper>
  );
}