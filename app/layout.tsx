import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Base Deployer',
  description: 'Déployez facilement vos contrats sur Base',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {/* On enveloppe tout le site avec nos outils Web3 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}