'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Permet de savoir quel bouton doit être "actif" visuellement
  const currentTab = searchParams.get('tab');
  const isHome = !currentTab && pathname === '/' && !currentTab;


  return (
    // La largeur passe dynamiquement de w-64 à w-20
    <aside className={`flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/40 z-20 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* 1. LOGO & BOUTON RANGER */}
      <div className={`h-20 flex items-center border-b border-slate-800/50 ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 cursor-pointer" onClick={() => setIsCollapsed(false)}>
            <span className="text-lg font-bold text-white">F</span>
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold tracking-wide text-white ml-3 whitespace-nowrap">
              Forgenix
            </h1>
          )}
        </div>

        {/* Bouton avec icône pour ranger */}
        {!isCollapsed && (
          <button onClick={() => setIsCollapsed(true)} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        )}
      </div>

      {/* 2. MENU DE NAVIGATION */}
      <nav className={`flex-1 overflow-y-auto py-6 space-y-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>

        {!isCollapsed && <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">La Forge</p>}

        {/* BOUTON 1 : HOME */}
        <button
          onClick={() => router.push('/')}
          className={`w-full flex items-center py-2.5 rounded-lg transition-colors ${isHome ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50'} ${isCollapsed ? 'justify-center px-0' : 'px-3 text-sm font-medium'}`}
        >
          <i className="fi fi-rr-home text-xl"></i>
          {!isCollapsed && <span className="ml-3">Accueil</span>}
        </button>

        {/* BOUTON 2 : MESSAGE */}
        <button
          onClick={() => router.push('/forge?tab=message')}
          className={`w-full flex items-center py-2.5 rounded-lg transition-colors ${currentTab === 'message' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50'} ${isCollapsed ? 'justify-center px-0' : 'px-3 text-sm font-medium'}`}
        >
          <i className="fi fi-rr-edit text-xl"></i>
          {!isCollapsed && <span className="ml-3">Message On-Chain</span>}
        </button>

        {/* BOUTON 3 : TOKEN */}
        <button
          onClick={() => router.push('/forge?tab=token')}
          className={`w-full flex items-center py-2.5 rounded-lg transition-colors ${currentTab === 'token' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50'} ${isCollapsed ? 'justify-center px-0' : 'px-3 text-sm font-medium'}`}
        >
          <i className="fi fi-rr-coins text-xl"></i>
          {!isCollapsed && <span className="ml-3">Token ERC-20</span>}
        </button>

        {/* BOUTON 4 : NFT */}
        <button
          onClick={() => router.push('/forge?tab=nft')}
          className={`w-full flex items-center py-2.5 rounded-lg transition-colors ${currentTab === 'nft' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50'} ${isCollapsed ? 'justify-center px-0' : 'px-3 text-sm font-medium'}`}
        >
          <i className="fi fi-rr-picture text-xl"></i>
          {!isCollapsed && <span className="ml-3">Collection NFT</span>}
        </button>

        <div className="mt-8">
          {!isCollapsed && <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Autres Services</p>}
          <button disabled title={isCollapsed ? "Déploiement Auto" : ""} className={`w-full flex items-center py-2.5 rounded-lg text-slate-600 cursor-not-allowed ${isCollapsed ? 'justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <span className="text-lg opacity-50">⚡</span>
            {!isCollapsed && <span className="ml-3 whitespace-nowrap">Déploiement Auto</span>}
          </button>
          <button disabled title={isCollapsed ? "Bridge Sécurisé" : ""} className={`w-full flex items-center py-2.5 rounded-lg text-slate-600 cursor-not-allowed ${isCollapsed ? 'justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <span className="text-lg opacity-50">🌉</span>
            {!isCollapsed && <span className="ml-3 whitespace-nowrap">Bridge Sécurisé</span>}
          </button>
        </div>
      </nav>

      {/* 3. FOOTER DE LA SIDEBAR */}
      <div className={`border-t border-slate-800/50 bg-slate-900/20 ${isCollapsed ? 'py-4 flex flex-col items-center gap-4' : 'p-4'}`}>
        {!isCollapsed && (
          <div className="flex justify-center gap-4 text-xs text-slate-500 mb-4">
            <a href="#" className="hover:text-slate-300 transition-colors whitespace-nowrap">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors whitespace-nowrap">Terms</a>
          </div>
        )}

        {/* Icônes Réseaux (s'affichent en colonne si réduit, en ligne sinon) */}
        <div className={`flex ${isCollapsed ? 'flex-col gap-4' : 'justify-center gap-5 mb-4'}`}>
          <a href="#" title="Discord" className="text-slate-400 hover:text-indigo-400 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" /></svg></a>
          <a href="#" title="X (Twitter)" className="text-slate-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
        </div>

        {!isCollapsed && (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 mt-2">
            <span>Audit by</span><span className="text-slate-300">🛡️ Forgenix</span>
          </div>
        )}
      </div>
    </aside>
  );
}