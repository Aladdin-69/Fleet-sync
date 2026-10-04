export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Mentions légales</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Informations de l'entreprise</h2>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <p><strong>Raison sociale :</strong> BLOCKLABCHAIN</p>
              <p><strong>SIRET :</strong> 98153792100018</p>
              <p><strong>Adresse :</strong> 9 RUE DES COLONNES, 75002 PARIS, France</p>
              <p><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Directeur de la publication</h2>
            <p>Le site est édité par BLOCKLABCHAIN. Le directeur de la publication est responsable du contenu du site.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Hébergement</h2>
            <p>Ce site est hébergé par GoDaddy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Propriété intellectuelle</h2>
            <p>L'ensemble des éléments composant le site (textes, images, logos, etc.) sont protégés par les droits d'auteur et autres droits de propriété intellectuelle. Toute reproduction, représentation, modification, adaptation, traduction ou exploitation de ces éléments, en tout ou partie, sans l'autorisation écrite préalable de BLOCKLABCHAIN, est strictement interdite.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Responsabilité</h2>
            <p>BLOCKLABCHAIN s'efforce de maintenir le site en bon fonctionnement. Cependant, nous ne sommes pas responsables des dommages directs ou indirects résultant de l'accès, de l'utilisation ou de l'impossibilité d'utiliser le site ou les informations qu'il contient.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Droit applicable</h2>
            <p>Le site et ces mentions légales sont soumis au droit français. Tout litige relatif au site sera de la compétence exclusive des juridictions françaises.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact</h2>
            <p>Pour toute question ou demande concernant le site, vous pouvez nous contacter à l'adresse indiquée ci-dessus.</p>
          </section>
        </div>
      </div>
    </div>
  );
}