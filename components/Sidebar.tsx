'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { ForgenixLogo, ForgenixText } from '@/components/ui/ForgenixLogo';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (val: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '/dashboard';
  const isSimple = pathname.includes('/forge/simple');
  const isMessage = pathname.includes('/forge/message');
  const isERC20 = pathname.includes('/forge/erc20');
  const isB20 = pathname.includes('/forge/b20');
  const isERC721 = pathname.includes('/forge/erc721');
  const isERC1155 = pathname.includes('/forge/erc1155');

  // Empêcher le scroll sur mobile si le menu est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Fonction pour naviguer ET fermer le menu mobile
  const navigateTo = (path: string) => {
    router.push(path);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Overlay mobile (Noir transparent) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity" 
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar principale */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full z-40
        flex-shrink-0 flex flex-col transition-all duration-300 bg-bar
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'} 
        ${isCollapsed ? 'md:w-22 w-72' : 'w-72'}
      `}>

        {/* 1. LOGO & TOGGLE BUTTON */}
        <div className={`h-16 md:h-20 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4 md:px-6"}`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl cursor-pointer ml-2 mt-4"
            >
              <ForgenixLogo className="text-[#0052FF]" size={36} />
            </button>
          ) : (
            <>
              <div className="flex items-center mr-4">
                <button type="button" className="flex h-12 w-12 items-center justify-center">
                  <ForgenixLogo className="text-[#0052FF]" size={36} />
                </button>
                <div className="flex items-center">
                  <ForgenixText className="text-[#0052FF]" size={22} />
                </div>
              </div>

              {/* Bouton fermer sur Mobile */}
              <button 
                className="md:hidden p-2 text-secondary hover:text-foreground"
                onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {/* Collapse button sur Desktop */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="hidden md:block text-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* 2. NAVIGATION MENU */}
        <nav className={`flex-1 overflow-y-auto py-6 space-y-2 md:space-y-3 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <button onClick={() => navigateTo('/dashboard')} className={`cursor-pointer w-full flex items-center py-2.5 rounded-xl transition-all duration-200 ${isHome ? 'bg-accent/10 text-accent' : 'text-secondary hover:bar-button-hover'} ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <i className="fi fi-rr-home flex text-xl"></i>
            <span className={`ml-3 ${isCollapsed ? 'md:hidden' : 'block'}`}>Dashboard</span>
          </button>

          {/* CORRECTION: Affichage exclusif basé sur isCollapsed */}
          {!isCollapsed && <p className="px-3 mt-5 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">The Forge</p>}

          <button onClick={() => navigateTo('/forge/simple')} className={`cursor-pointer w-full flex items-center py-2.5 rounded-xl transition-all duration-200 ${isSimple ? 'bg-accent/10 text-accent' : 'text-secondary hover:bar-button-hover'} ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <i className="fi fi-rr-document flex text-xl"></i>
            <span className={`ml-3 ${isCollapsed ? 'md:hidden' : 'block'}`}>Basic Contract</span>
          </button>

          <button onClick={() => navigateTo('/forge/message')} className={`cursor-pointer w-full flex items-center py-2.5 rounded-xl transition-all duration-200 ${isMessage ? 'bg-accent/10 text-accent' : 'text-secondary hover:bar-button-hover'} ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <i className="fi fi-rr-edit flex text-xl"></i>
            <span className={`ml-3 ${isCollapsed ? 'md:hidden' : 'block'}`}>On-Chain Message</span>
          </button>

          <button onClick={() => navigateTo('/forge/erc20')} className={`cursor-pointer w-full flex items-center py-2.5 rounded-xl transition-all duration-200 ${isERC20 ? 'bg-accent/10 text-accent' : 'text-secondary hover:bar-button-hover'} ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <i className="fi fi-rr-coins flex text-xl"></i>
            <span className={`ml-3 ${isCollapsed ? 'md:hidden' : 'block'}`}>ERC-20 Token</span>
          </button>

          <button onClick={() => navigateTo('/forge/b20')} className={`cursor-pointer w-full flex items-center py-2.5 rounded-xl transition-all duration-200 ${isB20 ? 'bg-accent/10 text-accent' : 'text-secondary hover:bar-button-hover'} ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <i className="fi fi-rr-bolt flex text-xl"></i>
            <span className={`ml-3 ${isCollapsed ? 'md:hidden' : 'block'}`}>B20 Asset (Base)</span>
          </button>

          <button onClick={() => navigateTo('/forge/erc721')} className={`cursor-pointer w-full flex items-center py-2.5 rounded-xl transition-all duration-200 ${isERC721 ? 'bg-accent/10 text-accent' : 'text-secondary hover:bar-button-hover'} ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <i className="fi fi-rr-picture flex text-xl"></i>
            <span className={`ml-3 ${isCollapsed ? 'md:hidden' : 'block'}`}>NFT Collection</span>
          </button>

          <button onClick={() => navigateTo('/forge/erc1155')} className={`cursor-pointer w-full flex items-center py-2.5 rounded-xl transition-all duration-200 ${isERC1155 ? 'bg-accent/10 text-accent' : 'text-secondary hover:bar-button-hover'} ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
            <i className="fi fi-rr-box flex text-xl"></i>
            <span className={`ml-3 ${isCollapsed ? 'md:hidden' : 'block'}`}>ERC-1155 Token</span>
          </button>

          <div className="mt-8">
            {/* CORRECTION: Affichage exclusif basé sur isCollapsed */}
            {!isCollapsed && <p className="px-3 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Other Services</p>}
            <button disabled className={`w-full flex items-center py-2.5 rounded-xl text-secondary/50 cursor-not-allowed opacity-60 ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
              <span className="text-lg opacity-50">⚡</span>
              <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>Auto Deploy</span>
            </button>
            <button disabled className={`w-full flex items-center py-2.5 rounded-xl text-secondary/50 cursor-not-allowed opacity-60 ${isCollapsed ? 'hidden md:flex justify-center px-0' : 'px-3 text-sm font-medium'}`}>
              <span className="text-lg opacity-50">🌉</span>
              <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>Secure Bridge</span>
            </button>
          </div>
        </nav>

        {/* THEME TOGGLE */}
        <div>
          <div className={`mb-1 flex items-center px-5 py-4 ${isCollapsed ? 'hidden md:flex flex-col gap-4' : 'gap-4'}`}>
            <ThemeToggle />
            <span className={`text-sm font-medium text-secondary ${isCollapsed ? 'md:hidden' : 'block'}`}>Change Theme</span>
          </div>

          {/* 3. FOOTER */}
          <div className={`border-t border-card pt-3 pb-6 ${isCollapsed ? 'px-2 hidden md:flex flex-col items-center gap-4' : 'px-5 block'}`}>
            <div className={`flex justify-center gap-4 text-xs text-secondary mb-4 ${isCollapsed ? 'md:hidden' : 'flex'}`}>
              <a href="#" className="hover:text-foreground transition-colors whitespace-nowrap">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors whitespace-nowrap">Terms</a>
            </div>

            <div className={`flex ${isCollapsed ? 'flex-col gap-4' : 'justify-center gap-5 mb-4'}`}>
              <a href="#" title="Discord" className="text-secondary hover:text-accent transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" /></svg></a>
              <a href="#" title="X (Twitter)" className="text-secondary hover:text-foreground transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
            </div>

            {/* CORRECTION: Affichage exclusif basé sur isCollapsed */}
            {!isCollapsed && (
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-secondary mt-2">
                <span>Audit by</span><span className="text-foreground">🛡️ Forgenix</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}