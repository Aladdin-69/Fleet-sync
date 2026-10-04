import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Users, Search, Plus, Star, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomerDetailModal from '@/components/clients/CustomerDetailModal';
import AddCustomerModal from '@/components/clients/AddCustomerModal';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

function ClientsContent() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.entities.Customer.list('-created_date')
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiClient.entities.Booking.list()
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setAddModalOpen(false);
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      customer.full_name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    );

    const matchesPlatform = platformFilter === 'all' || 
      customer.preferred_platforms?.includes(platformFilter);

    return matchesSearch && matchesPlatform;
  });

  const getCustomerBookings = (customerId) => {
    return bookings.filter(b => b.guest_name === customers.find(c => c.id === customerId)?.full_name);
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('clients.title')}</h1>
            <p className="text-slate-500 mt-1">{t('clients.subtitle')}</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('clients.addCustomer')}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder={t('clients.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('clients.allPlatforms')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('clients.allPlatforms')}</SelectItem>
                <SelectItem value="turo">Turo</SelectItem>
                <SelectItem value="getaround">Getaround</SelectItem>
                <SelectItem value="hunos_rent">Hunos Rent</SelectItem>
                <SelectItem value="manual">{t('clients.manual')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customers Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">{t('clients.loading')}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || platformFilter !== 'all' ? t('clients.noCustomersFound') : t('clients.noCustomers')}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchQuery || platformFilter !== 'all' ? t('clients.adjustFilters') : t('clients.addFirstCustomer')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => {
              const customerBookings = getCustomerBookings(customer.id);
              return (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {customer.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{customer.full_name}</h3>
                        <p className="text-sm text-slate-500">{customer.email}</p>
                      </div>
                    </div>
                    {customer.vip_status && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Star className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    {customer.phone && (
                      <p className="text-sm text-slate-600">📱 {customer.phone}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-sm text-slate-500">{t('clients.bookings')}</span>
                      <span className="font-semibold text-slate-900">{customerBookings.length}</span>
                    </div>
                    {customer.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-slate-900">{customer.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerDetailModal
        customer={selectedCustomer}
        bookings={selectedCustomer ? getCustomerBookings(selectedCustomer.id) : []}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onUpdate={(id, data) => updateCustomerMutation.mutate({ id, data })}
      />
      
      <AddCustomerModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={(data) => createCustomerMutation.mutate(data)}
      />
    </div>
  );
}

export default function Clients() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <ClientsContent />
    </ProtectedPageWrapper>
  );
}