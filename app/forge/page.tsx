'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import ForgerContent from '../Pages/Forger';

function ForgeRenderer() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'message';
  
  // On définit le titre selon l'onglet
const pageTitle = 
  currentTab === 'message' ? "Graver un Message" : 
  currentTab === 'token' ? "Créer un Token ERC-20" : 
  currentTab === 'b20' ? "Lancer un Token B20" :
  "Lancer un NFT";

  return (
    <DashboardLayout title={pageTitle}>
      <ForgerContent initialTab={currentTab} />
    </DashboardLayout>
  );
}

export default function ForgePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950 text-white flex items-center justify-center">Chargement...</div>}>
      <ForgeRenderer />
    </Suspense>
  );
}