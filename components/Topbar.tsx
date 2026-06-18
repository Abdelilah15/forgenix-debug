import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
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
          openAccountModal,
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
                  <div className="flex items-center gap-4">
                    
                    {/* CASE 1 : COMPTE (Extrait de l'adresse + Cercle de profil) */}
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="flex items-center gap-3 bg-slate-900 border border-slate-700 hover:border-slate-500 py-1.5 pl-4 pr-1.5 rounded-full transition-all text-slate-200"
                    >
                      {/* Extrait de l'adresse à gauche */}
                      <span className="font-medium text-sm tracking-wide">
                        {account.displayName}
                      </span>
                      
                      {/* Cercle de profil à droite avec un beau dégradé */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 border-2 border-slate-950 flex items-center justify-center overflow-hidden shadow-inner">
                         {account.ensAvatar ? (
                           <img src={account.ensAvatar} alt="ENS Avatar" className="w-full h-full object-cover" />
                         ) : (
                           <i className="fi fi-rr-user text-white text-xs mt-1"></i>
                         )}
                      </div>
                    </button>

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