import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Forgenix - Be active on web3',
  description: 'Forgenix is a web3 platform that allows you to interact with the Base blockchain, deploy smart contracts, and manage your digital assets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Importation forcée et garantie de la bibliothèque d'icônes Flaticon */}
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css" />
      </head>
      <body>
        {/* On enveloppe tout le site avec nos outils Web3 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}