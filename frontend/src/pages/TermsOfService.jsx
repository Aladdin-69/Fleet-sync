export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Conditions d'utilisation</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptation des conditions</h2>
            <p>En accédant et en utilisant ce site (ci-après "le Service"), vous acceptez d'être lié par ces Conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description du Service</h2>
            <p>FleetSync est une plateforme de gestion de flotte de véhicules de location. Le Service vous permet de :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gérer vos véhicules et annonces de location</li>
              <li>Synchroniser vos réservations depuis plusieurs plateformes</li>
              <li>Intégrer votre calendrier et votre email</li>
              <li>Analyser vos performances et revenus</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Compte utilisateur</h2>
            <p>Vous êtes responsable de :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>La confidentialité de vos identifiants de connexion</li>
              <li>Toute activité qui se produit sous votre compte</li>
              <li>Les informations exactes et à jour dans votre profil</li>
            </ul>
            <p className="mt-4">Vous acceptez de ne pas partager votre compte avec d'autres personnes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Utilisation acceptable</h2>
            <p>Vous acceptez de ne pas :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utiliser le Service de manière frauduleuse ou illégale</li>
              <li>Contourner les mesures de sécurité</li>
              <li>Télécharger ou transmettre des virus ou malwares</li>
              <li>Harceler, menacer ou intimider d'autres utilisateurs</li>
              <li>Violer les droits de propriété intellectuelle d'autrui</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Propriété intellectuelle</h2>
            <p>Tous les contenus, fonctionnalités et fonctionnements du Service sont la propriété exclusive de BLOCKLABCHAIN, ses contributeurs ou ses fournisseurs de contenu.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation de responsabilité</h2>
            <p>BLOCKLABCHAIN ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs résultant de votre utilisation du Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Garanties</h2>
            <p>Le Service est fourni "tel quel" sans aucune garantie. BLOCKLABCHAIN ne garantit pas que :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Le Service sera sans interruption ou sans erreur</li>
              <li>Les défauts seront corrigés</li>
              <li>Le Service ou les serveurs sont libres de virus</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Abonnement et paiement</h2>
            <p>Les abonnements FleetSync sont des abonnements renouvelés automatiquement. Vous pouvez annuler votre abonnement à tout moment. Aucun remboursement ne sera accordé pour les périodes restantes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Modifications du Service</h2>
            <p>BLOCKLABCHAIN se réserve le droit de modifier, suspendre ou interrompre le Service à tout moment, avec ou sans avis préalable.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Droit applicable</h2>
            <p>Ces Conditions d'utilisation sont régies par le droit français. Tout litige sera soumis à la juridiction exclusive des tribunaux français.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Contact</h2>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p>Pour toute question concernant ces Conditions d'utilisation :</p>
              <p className="mt-4"><strong>BLOCKLABCHAIN</strong><br/>
              9 RUE DES COLONNES<br/>
              75002 PARIS<br/>
              France</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}