export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Politique de confidentialité</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
            <p>BLOCKLABCHAIN ("nous", "notre" ou "nos") s'engage à protéger votre vie privée. Cette Politique de confidentialité explique comment nous collectons, utilisons, divulguons et sauvegardons vos données.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Informations que nous collectons</h2>
            <p>Nous collectons les informations que vous nous fournissez volontairement :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informations d'authentification (email, mot de passe)</li>
              <li>Données de profil (nom, adresse email)</li>
              <li>Informations relatives aux véhicules (plaque, VIN, photos)</li>
              <li>Données de réservation et de bookings</li>
              <li>Informations de paiement (via Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Utilisation de vos données</h2>
            <p>Nous utilisons vos données pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fournir, maintenir et améliorer nos services</li>
              <li>Traiter vos transactions et envoyer les confirmations</li>
              <li>Vous envoyer des communications marketing (avec votre consentement)</li>
              <li>Respecter nos obligations légales</li>
              <li>Détecter et prévenir les fraudes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Partage de vos données</h2>
            <p>Nous ne partageons pas vos données personnelles avec des tiers, sauf :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Avec nos prestataires de services (hébergement, paiement)</li>
              <li>Si la loi l'exige</li>
              <li>Pour protéger nos droits et votre sécurité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Sécurité des données</h2>
            <p>Nous mettons en place des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction. Cependant, aucun système de transmission sur Internet n'est totalement sécurisé.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Durée de conservation</h2>
            <p>Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services et respecter nos obligations légales. Les données de paiement sont conservées conformément aux exigences de conformité PCI-DSS.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Vos droits RGPD</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification des données inexactes</li>
              <li>Droit à l'effacement ("droit à l'oubli")</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="mt-4">Pour exercer ces droits, veuillez nous contacter à l'adresse indiquée ci-dessous.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Cookies</h2>
            <p>Notre site utilise des cookies pour améliorer votre expérience. Vous pouvez contrôler les cookies via les paramètres de votre navigateur.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contact</h2>
            <p>Pour toute question concernant cette Politique de confidentialité ou pour exercer vos droits, veuillez nous contacter :</p>
            <div className="bg-white p-4 rounded-lg border border-slate-200 mt-4">
              <p><strong>BLOCKLABCHAIN</strong><br/>
              9 RUE DES COLONNES<br/>
              75002 PARIS<br/>
              France</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Modifications</h2>
            <p>Nous nous réservons le droit de modifier cette Politique de confidentialité à tout moment. Les modifications prendront effet dès leur publication sur le site.</p>
          </section>
        </div>
      </div>
    </div>
  );
}