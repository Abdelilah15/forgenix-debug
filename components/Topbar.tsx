import React, { useState, useRef, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi'; // Importation pour la déconnexion

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { disconnect } = useDisconnect(); // Fonction pour déconnecter le wallet
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fonction pour fermer le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="h-20 border-b border-slate-800 bg-slate-950/80 px-8 flex justify-between items-center z-10 flex-shrink-0">
      <h2 className="text-lg font-semibold text-slate-300">
        {title || "Forgenix"}
      </h2>
      
      {/* UTILISATION DU BOUTON CUSTOM DE RAINBOWKIT */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                // 1. ÉTAT : NON CONNECTÉ
                if (!connected) {
                  return (
                    <button 
                      onClick={openConnectModal} 
                      type="button"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] flex items-center gap-2"
                    >
                      <i className="fi fi-rr-wallet"></i>
                      Connecter le Wallet
                    </button>
                  );
                }

                // 2. ÉTAT : MAUVAIS RÉSEAU
                if (chain.unsupported) {
                  return (
                    <button 
                      onClick={openChainModal} 
                      type="button" 
                      className="bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500/20 font-semibold py-2 px-4 rounded-xl transition-all flex items-center gap-2"
                    >
                      <i className="fi fi-rr-triangle-warning"></i>
                      Mauvais Réseau
                    </button>
                  );
                }

                // 3. ÉTAT : CONNECTÉ (Votre design personnalisé)
                return (
                  <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                    
                    {/* CASE 1 : COMPTE (Bouton Profil + Dropdown) */}
                    <div className="relative">
                        <button
                          // On remplace le modal par défaut par l'ouverture de notre propre menu
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          type="button"
                          className={`flex items-center gap-3 border transition-all py-1.5 pl-4 pr-1.5 rounded-full text-slate-200 ${isDropdownOpen ? 'bg-slate-800 border-slate-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                        >
                          {/* Extrait de l'adresse à gauche */}
                          <span className="font-medium text-sm tracking-wide">
                            {account.displayName}
                          </span>
                          
                          {/* Cercle de profil à droite */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 border-2 border-slate-950 flex items-center justify-center overflow-hidden shadow-inner">
                            {account.ensAvatar ? (
                              <img src={account.ensAvatar} alt="ENS Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <i className="fi fi-rr-user text-white text-xs mt-1"></i>
                            )}
                          </div>
                        </button>

                        {/* LE MENU DÉROULANT (DROPDOWN) */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                
                                {/* En-tête avec l'adresse complète (Bonus) */}
                                <div className="px-4 py-3 border-b border-slate-800/80 mb-2 bg-slate-900/50">
                                    <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wider">Connecté en tant que</p>
                                    <p className="text-xs font-mono text-indigo-300 truncate" title={account.address}>{account.address}</p>
                                </div>
                                
                                {/* Les options */}
                                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3">
                                    <i className="fi fi-rr-user text-slate-400"></i> My profile
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3">
                                    <i className="fi fi-rr-globe text-slate-400"></i> My domains
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3">
                                    <i className="fi fi-rr-picture text-slate-400"></i> My NFTs
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3">
                                    <i className="fi fi-rr-settings text-slate-400"></i> Settings
                                </button>
                                
                                <div className="h-px bg-slate-800/80 my-2"></div>
                                
                                {/* Bouton Déconnexion */}
                                <button 
                                    onClick={() => {
                                        disconnect(); // Déconnecte via Wagmi
                                        setIsDropdownOpen(false); // Ferme le menu
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                                >
                                    <i className="fi fi-rr-exit"></i> Disconnect
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CASE 2 : RÉSEAU CONNECTÉ (À droite) */}
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-slate-500 py-2 px-4 rounded-xl transition-all text-slate-200 font-medium text-sm"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 20, height: 20 }}
                            />
                          )}
                        </div>
                      )}
                      <span>{chain.name}</span>
                      <i className="fi fi-rr-angle-small-down text-slate-400 mt-1"></i>
                    </button>

                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </header>
  );
}