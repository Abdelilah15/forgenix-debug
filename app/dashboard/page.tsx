'use client';
import React, { Suspense } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import HomeContent from '../Pages/Home';

export default function HomeRoot() {
  return (
    // On enveloppe la page avec Suspense pour empêcher Vercel de planter au build
    <Suspense fallback={<div className="h-screen text-white flex items-center justify-center">Chargement...</div>}>
      <DashboardLayout title="Vue d'ensemble">
        <HomeContent />
      </DashboardLayout>
    </Suspense>
  );
}