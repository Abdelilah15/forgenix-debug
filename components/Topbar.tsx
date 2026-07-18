'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect, useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { DailyStreakModal } from '@/components/streak';

interface TopbarProps {
  title?: string;
  setIsMobileMenuOpen?: (val: boolean) => void;
}

interface UserProfile {
  username: string;
  role: string;
  address: string;
  avatar?: string;
}

export default function Topbar({ title, setIsMobileMenuOpen }: TopbarProps) {
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('nexulayer_profile');
      if (cached) return JSON.parse(cached);
    }
    return null;
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fix: useCallback pour éviter les stale closures
  const fetchUser = useCallback(async () => {
    if (isConnected && address) {
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
          localStorage.setItem('nexulayer_profile', JSON.stringify(data));
        }
      } catch (error) {
        console.error("Profile sync error", error);
      }
    } else {
      setUserProfile(null);
      localStorage.removeItem('nexulayer_profile');
    }
  }, [isConnected, address]);

  // ✅ Fix: fetchUser dans les deps
  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    window.addEventListener('profileUpdated', fetchUser);
    return () => window.removeEventListener('profileUpdated', fetchUser);
  }, [fetchUser]);

  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex justify-between items-center z-10 flex-shrink-0 bg-bar">

      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(true)}
          className="md:hidden p-2 text-foreground rounded-lg bg-card border border-card"
        >
          <i className="fi fi-rr-menu-burger flex text-[#71717A]"></i>
        </button>

        <h2 className="text-base md:text-lg font-semibold text-foreground truncate max-w-[120px] md:max-w-none">
          {title || "Nexulayer"}
        </h2>
      </div>

      <ConnectButton.Custom>
        {({ account, chain, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

          return (
            <div {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="bg-[#2b7fff] hover:bg-[#155dfc] text-white font-semibold py-2 md:py-2.5 px-4 md:px-6 rounded-xl transition-colors flex items-center gap-2 cursor-pointer text-sm md:text-base"
                    >
                      <i className="fi fi-rr-wallet"></i>
                      <span className="hidden md:inline">Connect Wallet</span>
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="text-red-500 border font-semibold py-2 px-4 rounded-xl transition-colors flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <i className="fi fi-rr-triangle-warning"></i>
                      <span className="hidden md:inline">Wrong Network</span>
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-2 md:gap-4 relative" ref={dropdownRef}>

                    {/* 1. Bouton Streak */}
                    <button
                      onClick={() => setIsStreakModalOpen(true)}
                      className="w-9 h-9 md:w-auto md:h-auto md:p-3.5 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all border border-orange-500/20"
                      title="Daily Streak"
                    >
                      <i className="fi fi-rr-flame flex text-sm md:text-base"></i>
                    </button>

                    {/* 2. Network Selector */}
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="w-9 h-9 md:w-auto md:h-auto md:py-1.5 md:px-4 flex items-center justify-center gap-0 md:gap-2 border border-[#2b7fff] rounded-full transition-colors text-foreground font-medium text-sm cursor-pointer"
                    >
                      {chain.hasIcon ? (
                        <div style={{ background: chain.iconBackground, width: 30, height: 30, borderRadius: 999, overflow: 'hidden' }}>
                          {chain.iconUrl && (
                            <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} style={{ width: 30, height: 30 }} />
                          )}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center text-[10px] text-white">
                          {chain.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="hidden md:block">{chain.name}</span>
                      <i className="fi fi-rr-angle-small-down text-secondary mt-1 hidden md:block"></i>
                    </button>

                    {/* 3. User Profile Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        type="button"
                        className="w-9 h-9 md:w-auto md:h-auto md:py-1.5 md:pl-4 md:pr-1.5 flex items-center justify-center md:gap-3 transition-colors rounded-full border border-[#2b7fff] md:border-0 md:bg-[#2b7fff] md:hover:bg-[#155dfc] text-white cursor-pointer"
                      >
                        <span className="hidden md:inline font-medium text-sm tracking-wide text-white">
                          {userProfile?.username || account.displayName}
                        </span>

                        <div className="w-8 h-8 md:w-8 md:h-8 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center overflow-hidden">
                          {userProfile?.avatar ? (
                            <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                          ) : account.ensAvatar ? (
                            <img src={account.ensAvatar} alt="ENS Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <i className="fi fi-rr-user text-white text-[10px] md:text-xs mt-1"></i>
                          )}
                        </div>
                      </button>

                      {isDropdownOpen && (
                        <div className="
                          absolute right-0 mt-3 z-50
                          w-[calc(100vw-2rem)] max-w-xs
                          sm:w-72
                          bg-bar border border-card rounded-2xl py-2
                          animate-in fade-in slide-in-from-top-2 duration-200 drop-shadow-xl
                        ">
                          {/* En-tête profil */}
                          <div className="px-4 py-3 mb-2 bg-hover/30 border-b border-card">
                            <p className="text-sm font-bold text-foreground truncate mb-0.5">
                              {userProfile ? userProfile.username : 'Loading...'}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-xs font-mono text-secondary truncate" title={account.address}>
                                {account.address}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleCopy(account.address)}
                                className="shrink-0 p-1.5 rounded-lg hover:bg-hover transition-colors"
                              >
                                <i className={`fi ${copied ? "fi-rr-check" : "fi-rr-copy"} text-xs text-secondary`} />
                              </button>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="px-2">
                            <button
                              onClick={() => { router.push('/Profile'); setIsDropdownOpen(false); }}
                              className="w-full text-left px-4 py-3 text-sm text-secondary rounded-xl hover:bar-button-hover hover:text-foreground transition-colors flex items-center gap-3"
                            >
                              <i className="fi fi-rr-user text-secondary"></i> Profile
                            </button>
                            <button
                              onClick={() => { disconnect(); localStorage.removeItem('nexulayer_profile'); setIsDropdownOpen(false); }}
                              className="w-full text-left px-4 py-3 text-sm text-red-500 rounded-xl hover:bg-red-500/10 transition-colors flex items-center gap-3"
                            >
                              <i className="fi fi-rr-exit"></i> Disconnect
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      <DailyStreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        address={address}
      />

    </header>
  );
}
