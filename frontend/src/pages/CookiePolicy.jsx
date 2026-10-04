export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Politique relative aux cookies</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Qu'est-ce qu'un cookie ?</h2>
            <p>Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, tablette, téléphone) lorsque vous visitez un site web. Les cookies permettent au site de reconnaître votre appareil lors de vos visites ultérieures.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Types de cookies utilisés</h2>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cookies essentiels</h3>
              <p>Ces cookies sont nécessaires pour le fonctionnement du site et ne peuvent pas être désactivés. Ils incluent :</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Authentification et sécurité</li>
                <li>Gestion de session</li>
                <li>Préférences de langue</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cookies de performance</h3>
              <p>Ces cookies nous aident à comprendre comment vous utilisez le site :</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Google Analytics (analyse du trafic)</li>
                <li>Tracking des performances</li>
                <li>Détection des erreurs</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cookies de fonctionnalité</h3>
              <p>Ces cookies se souviennent de vos choix pour améliorer votre expérience :</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Préférences de thème (clair/sombre)</li>
                <li>Langue préférée</li>
                <li>Paramètres de notification</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cookies marketing</h3>
              <p>Ces cookies nous permettent de vous proposer du contenu adapté :</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Retargeting publicitaire</li>
                <li>Publicités personnalisées</li>
                <li>Suivi des conversions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contrôle des cookies</h2>
            <p>Vous avez le droit de contrôler les cookies sur votre appareil :</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Accepter tous les cookies</strong> : Vous permettez à FleetSync d'utiliser tous les types de cookies</li>
              <li><strong>Rejeter les cookies non essentiels</strong> : Seuls les cookies essentiels seront utilisés</li>
              <li><strong>Paramètres de cookies</strong> : Vous pouvez gérer chaque catégorie individuellement via votre navigateur</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Comment gérer les cookies</h2>
            <p>La plupart des navigateurs web vous permettent de contrôler les cookies via les paramètres. Consultez l'aide de votre navigateur pour :</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Bloquer les cookies</li>
              <li>Supprimer les cookies existants</li>
              <li>Être averti avant qu'un cookie ne soit créé</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Notez que la suppression ou le blocage des cookies peut affecter la fonctionnalité du site.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cookies tiers</h2>
            <p>Nous utilisons les services de tiers qui peuvent placer des cookies sur votre appareil :</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Google Analytics</strong> : Pour analyser l'utilisation du site</li>
              <li><strong>Stripe</strong> : Pour traiter les paiements en toute sécurité</li>
              <li><strong>GoDaddy</strong> : Pour l'hébergement du site</li>
            </ul>
            <p className="mt-4">Nous encourageons la lecture de leurs politiques de confidentialité respectives.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Conformité RGPD</h2>
            <p>Conformément au RGPD, BLOCKLABCHAIN :</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Obtient votre consentement avant de placer des cookies non essentiels</li>
              <li>Conserve un enregistrement de votre consentement</li>
              <li>Vous permet de retirer votre consentement à tout moment</li>
              <li>Transparence sur l'utilisation des cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Modifications</h2>
            <p>Cette Politique relative aux cookies peut être mise à jour périodiquement. Les modifications prendront effet dès leur publication sur le site.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact</h2>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p>Pour toute question concernant nos pratiques en matière de cookies :</p>
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