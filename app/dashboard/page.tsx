'use client';

import React, { Suspense } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function DashboardPage() {
  return (
    // On enveloppe la page avec Suspense pour empêcher Vercel de planter au build
    <Suspense fallback={<div className="h-screen text-foreground flex items-center justify-center">Chargement...</div>}>
      <DashboardLayout title="Dashboard">
        
        {/* Contenu "Coming Soon" qui remplace l'ancien HomeContent */}
        <div className="bg-card p-10 rounded-2xl flex flex-col items-center justify-center text-center min-h-[50vh] animate-in fade-in duration-500">
          <div className="text-5xl mb-6 opacity-80">⚡</div>
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Dashboard Coming Soon
          </h3>
          <p className="text-secondary max-w-lg leading-relaxed">
            We are currently forging this space. Soon, you will be able to track your deployed smart contracts, monitor on-chain metrics, and manage your portfolio directly from here. Stay tuned!
          </p>
        </div>

      </DashboardLayout>
    </Suspense>
  );
}