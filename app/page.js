// "/" est servi par la reecriture de next.config.mjs, qui renvoie le fichier
// autoportant public/dossier.html. Cette page n'est atteinte que si la
// reecriture ne s'applique pas ; elle pointe alors explicitement vers les
// deux documents plutot que d'afficher une page blanche.
export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem 1.5rem', maxWidth: '34rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>LOWI</h1>
      <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Fractional real estate investment in Bangkok, Thailand.
      </p>
      <p style={{ lineHeight: 2 }}>
        <a href="/dossier.html">Investor dossier</a>
        <br />
        <a href="/deck.html">Slide deck</a>
      </p>
    </main>
  )
}
