/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le dossier et le diaporama sont deux fichiers HTML autoportants servis
  // depuis public/ : police et images embarquees, aucune dependance externe.
  // On les expose sur des URL propres plutot que de les reecrire en JSX —
  // les convertir n'apporterait rien et ferait diverger la source du deck.
  // beforeFiles, et pas la forme courte : une reecriture simple s'applique
  // APRES les routes, donc app/page.js gagnait sur "/" et le dossier n'etait
  // jamais servi. Mesure locale : "/" renvoyait 5 545 octets au lieu de 164 763.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/dossier.html' },
        { source: '/deck', destination: '/deck.html' },
      ],
    }
  },
}

export default nextConfig
