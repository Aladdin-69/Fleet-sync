import { Wrench, Truck, ClipboardCheck } from 'lucide-react';
import IntegrationCard from './IntegrationCard';
import { toast } from 'sonner';

export default function MaintenanceIntegrations() {
  const handleConnect = (provider) => {
    toast.info(`Configuration de l'intégration ${provider}...`);
    // Logique de connexion à l'API du fournisseur
  };

  const handleDisconnect = (provider) => {
    toast.success(`${provider} déconnecté`);
  };

  return (
    <div className="space-y-4">
      <IntegrationCard
        title="AutoMaintenance Pro"
        description="Synchronisez automatiquement les statuts de maintenance et les rappels d'entretien"
        icon={Wrench}
        connected={false}
        onConnect={() => handleConnect('AutoMaintenance Pro')}
        onDisconnect={() => handleDisconnect('AutoMaintenance Pro')}
      />

      <IntegrationCard
        title="Fleet Service API"
        description="Connectez votre fournisseur de services de flotte pour des mises à jour en temps réel"
        icon={Truck}
        connected={false}
        onConnect={() => handleConnect('Fleet Service API')}
        onDisconnect={() => handleDisconnect('Fleet Service API')}
      />

      <IntegrationCard
        title="Maintenance Tracker"
        description="Suivi automatique des inspections, réparations et entretiens préventifs"
        icon={ClipboardCheck}
        connected={false}
        onConnect={() => handleConnect('Maintenance Tracker')}
        onDisconnect={() => handleDisconnect('Maintenance Tracker')}
      />
    </div>
  );
}