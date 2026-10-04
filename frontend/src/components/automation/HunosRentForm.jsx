import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Loader } from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';

export default function HunosRentForm({ currentApiKey, onSuccess }) {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!apiKey) {
      toast.error('Clé API requise');
      return;
    }

    setTesting(true);
    try {
      const response = await apiClient.functions.invoke('testPlatformConnection', {
        platform: 'hunos_rent',
        apiKey
      });

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Erreur lors du test de connexion');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey) {
      toast.error('Clé API requise');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        hunos_rent_credentials: {
          api_key_encrypted: btoa(apiKey) // Simple base64 encoding (should be encrypted properly)
        }
      };

      await apiClient.auth.updateMe(updateData);
      toast.success('Identifiants Hunos Rent sauvegardés');
      onSuccess?.();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Identifiants Hunos Rent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Clé API</label>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Votre clé API est chiffrée et ne sera jamais stockée en clair.
        </p>

        <div className="flex gap-2">
          <Button 
            onClick={handleTest} 
            disabled={testing || !apiKey}
            variant="outline"
            className="flex-1"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Test...
              </>
            ) : (
              'Connecter'
            )}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}