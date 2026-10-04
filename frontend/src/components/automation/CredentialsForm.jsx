import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Loader } from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';

export default function CredentialsForm({ platform, currentEmail, onSuccess }) {
  const [email, setEmail] = useState(currentEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!email) {
      toast.error('Email requis');
      return;
    }

    setTesting(true);
    try {
      const response = await apiClient.functions.invoke('savePlatformAccount', {
        platform,
        email
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
    if (!email) {
      toast.error('Email requis');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.functions.invoke('savePlatformAccount', {
        platform,
        email
      });
      toast.success(response.data.message || `Compte ${platform} enregistré`);
      setPassword('');
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg capitalize flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Identifiants {platform}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mot de passe</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          FleetSync enregistre seulement l’adresse du compte. Le mot de passe n’est pas stocké et n’est pas envoyé à la plateforme.
        </p>

        <div className="flex gap-2">
          <Button 
            onClick={handleTest} 
            disabled={testing || !email || !password}
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