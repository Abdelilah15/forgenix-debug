'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Vérifie si un portefeuille web3 (comme MetaMask) est injecté dans le navigateur
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Veuillez installer MetaMask ou un portefeuille compatible.');
      }

      // 1. Initialisation du client Viem lié à l'extension du navigateur
      const walletClient = createWalletClient({
        chain: baseSepolia,
        transport: custom(window.ethereum)
      });

      // 2. Demande d'autorisation pour lire l'adresse du portefeuille
      const [address] = await walletClient.requestAddresses();

      // 3. Préparation du message à signer
      const message = `Connexion Admin Nexulayer - ${Date.now()}`;

      // 4. Demande de signature cryptographique à l'utilisateur
      const signature = await walletClient.signMessage({
        account: address,
        message,
      });

      // 5. Envoi au backend (notre route route API créée précédemment)
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur d\'authentification. Accès refusé.');
      }

      // 6. Succès : Le backend a placé le cookie, on redirige vers le Dashboard
      router.push('/admin/airdrops');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Nexulayer Admin</h1>
          <p className="text-neutral-400 text-sm">
            Connectez votre portefeuille pour accéder au tableau de bord.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Vérification on-chain...
            </span>
          ) : (
            'Connecter MetaMask'
          )}
        </button>
      </div>
    </div>
  );
}
