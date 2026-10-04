import { useState } from 'react';
import apiClient from '@/api/client';
import { useLanguage } from '@/components/LanguageProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PayPalIntegration() {
  const { t, language } = useLanguage();
  const [merchantId, setMerchantId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const { data: connection } = useQuery({
    queryKey: ['paypal-connection'],
    queryFn: async () => {
      const connections = await apiClient.entities.PayPalConnection.list('-created_date', 1);
      return connections[0] || null;
    }
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['paypal-transactions'],
    queryFn: () => apiClient.entities.PayPalTransaction.list('-transaction_date', 10),
    enabled: !!connection,
    initialData: []
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!merchantId.trim()) {
        throw new Error('Merchant ID is required');
      }
      return apiClient.entities.PayPalConnection.create({
        merchant_id: merchantId,
        connected_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setMerchantId('');
      queryClient.invalidateQueries({ queryKey: ['paypal-connection'] });
      toast.success(language === 'fr' ? 'Compte PayPal connecté' : 'PayPal account connected');
    },
    onError: (error) => {
      toast.error(language === 'fr' ? 'Erreur de connexion' : 'Connection error');
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id) => {
      return apiClient.entities.PayPalConnection.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paypal-connection'] });
      queryClient.invalidateQueries({ queryKey: ['paypal-transactions'] });
      toast.success(language === 'fr' ? 'Compte déconnecté' : 'Account disconnected');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Appel à un endpoint PayPal pour récupérer les transactions
      // Cette partie nécessiterait une implémentation backend complète avec API PayPal
      return apiClient.functions.invoke('syncPayPalTransactions', {
        paypal_connection_id: connection.id,
        transactions: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paypal-transactions'] });
      toast.success(language === 'fr' ? 'Synchronisation réussie' : 'Sync successful');
    },
    onError: () => {
      toast.error(language === 'fr' ? 'Erreur de synchronisation' : 'Sync error');
    }
  });

  const statusColor = {
    completed: 'bg-green-50 border-green-200',
    pending: 'bg-yellow-50 border-yellow-200',
    failed: 'bg-red-50 border-red-200',
    refunded: 'bg-slate-50 border-slate-200'
  };

  const statusBadgeColor = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      {!connection ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>{language === 'fr' ? 'Connecter PayPal' : 'Connect PayPal'}</CardTitle>
                <CardDescription>
                  {language === 'fr' 
                    ? 'Synchronisez vos transactions PayPal'
                    : 'Sync your PayPal transactions'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'fr' ? 'ID Marchand PayPal' : 'PayPal Merchant ID'}
              </label>
              <Input
                placeholder="XXXXXXXXXX"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                disabled={connectMutation.isPending}
              />
              <p className="text-xs text-slate-500 mt-1">
                {language === 'fr'
                  ? 'Vous trouverez votre ID sur le tableau de bord PayPal'
                  : 'You can find your ID on PayPal Dashboard'
                }
              </p>
            </div>
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={!merchantId.trim() || connectMutation.isPending}
              className="w-full"
            >
              {connectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === 'fr' ? 'Connecter' : 'Connect'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Connection Status Card */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <CardTitle className="text-green-900">
                      {language === 'fr' ? 'PayPal Connecté' : 'PayPal Connected'}
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      {language === 'fr' ? 'Marchand:' : 'Merchant:'} {connection.merchant_id}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => disconnectMutation.mutate(connection.id)}
                  disabled={disconnectMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">{language === 'fr' ? 'Statut Sync' : 'Sync Status'}</p>
                  <Badge className={cn(
                    'mt-1',
                    connection.sync_status === 'synced' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                  )}>
                    {connection.sync_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-600">{language === 'fr' ? 'Dernière Sync' : 'Last Sync'}</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {connection.last_sync ? new Date(connection.last_sync).toLocaleDateString(language) : language === 'fr' ? 'Jamais' : 'Never'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                variant="outline"
                className="w-full mt-4"
              >
                {syncMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Synchroniser Maintenant' : 'Sync Now'}
              </Button>
            </CardContent>
          </Card>

          {/* Transactions List */}
          {transactionsLoading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              </CardContent>
            </Card>
          ) : transactions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'fr' ? 'Transactions Récentes' : 'Recent Transactions'}
                </CardTitle>
                <CardDescription>
                  {language === 'fr' ? 'Dernières transactions synchronisées' : 'Latest synced transactions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className={cn('p-4 rounded-lg border', statusColor[tx.status])}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{tx.payer_name}</p>
                          <Badge className={statusBadgeColor[tx.status]}>
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="font-semibold text-slate-900">{tx.amount.toFixed(2)}€</p>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{tx.subject}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(tx.transaction_date).toLocaleDateString(language)}</span>
                        <span>{language === 'fr' ? 'Net:' : 'Net:'} {tx.net_amount.toFixed(2)}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600">
                  {language === 'fr' 
                    ? 'Aucune transaction synchronisée'
                    : 'No synced transactions'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-3">
            {language === 'fr' ? 'Comment connecter PayPal' : 'How to connect PayPal'}
          </h4>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <span>{language === 'fr' 
                ? 'Allez sur votre compte PayPal' 
                : 'Go to your PayPal account'
              }</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <span>{language === 'fr'
                ? 'Accédez à Paramètres > Outils de business > Préférences API'
                : 'Go to Settings > Business tools > API preferences'
              }</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <span>{language === 'fr'
                ? 'Trouvez votre ID marchand et collez-le ci-dessus'
                : 'Find your Merchant ID and paste it above'
              }</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}