'use client';
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

// Import our new extracted components and logic
import SuccessModal from '@/components/forge/SuccessModal';
import PricingWarningModal from '@/components/forge/PricingWarningModal';
import { useDeployer } from '@/app/hooks/useDeployer';

export default function Forger({ initialTab }: { initialTab: string }) {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Bring in the heavy logic from our custom hook
  const {
    isLoading, txHash, error, explorerUrl, isModalOpen, setIsModalOpen,
    networkName, deployedAddress, deploy, resetStates
  } = useDeployer();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [userCredits, setUserCredits] = useState<number>(0);

  // Sync tab & clean previous messages
  useEffect(() => {
    setActiveTab(initialTab);
    resetStates();
  }, [initialTab]);

  // Fetch Credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (!address) {
        setUserCredits(0);
        return;
      }
      try {
        const res = await fetch(`/api/user?wallet=${address}`);
        if (res.ok) {
          const data = await res.json();
          setUserCredits(data.credits);
          if (data.credits > 0) setRequestWhiteLabel(true);
        }
      } catch (error) {
        console.error("Failed to fetch credits", error);
      }
    };
    fetchCredits();
  }, [address]);

  // Form States
  const [msgText, setMsgText] = useState('GM Base!');
  const [tokenName, setTokenName] = useState('My Token');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [tokenSupply, setTokenSupply] = useState('10000');
  const [nftName, setNftName] = useState('My Collection');
  const [nftSymbol, setNftSymbol] = useState('MCN');
  const [nftSupply, setNftSupply] = useState('10');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [simpleName, setSimpleName] = useState('My Contract');
  const [requestWhiteLabel, setRequestWhiteLabel] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [royaltyFee, setRoyaltyFee] = useState('500');
  const [socials, setSocials] = useState({ website: '', twitter: '', telegram: '', discord: '', farcaster: '', github: '', tags: '' });

  const getElementType = () => activeTab === 'message' ? 'Message' : activeTab === 'token' ? 'ERC-20 Token' : activeTab === 'nft' ? 'NFT' : 'Basic Contract';
  const shareText = `🚀 I just deployed a ${getElementType()} contract on ${networkName}!\n\nCreate yours: https://forgnix.vercel.app/forge?tab=${activeTab}\nTrack onchain activity: https://forgnix.vercel.app\n@monx`;
  const encodedShareText = encodeURIComponent(shareText);

  const calculateFee = () => {
    let base = 0.00003;
    let wlSurcharge = 0;
    if (isAdvancedMode && (activeTab === 'token' || activeTab === 'nft')) {
      base = 0.0001;
      if (requestWhiteLabel && userCredits === 0) wlSurcharge = 0.00008;
    } else {
      if (requestWhiteLabel && userCredits === 0) wlSurcharge = 0.00005;
    }
    return (base + wlSurcharge).toFixed(5);
  };
  const currentFeeString = calculateFee();

  // Execute deployment using our hook
  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    const success = await deploy({
      activeTab, isAdvancedMode, mediaFile, description, nftName, tokenName, 
      socials, requestWhiteLabel, msgText, simpleName, tokenSymbol, tokenSupply, 
      nftSymbol, nftSupply, royaltyFee, currentFeeString, userCredits, 
      address: address as string | undefined,
      onCreditDeducted: (newCredits) => {
        setUserCredits(newCredits);
        if (newCredits === 0) setRequestWhiteLabel(false);
      }
    });

    if (success) {
      setMediaFile(null);
      setDescription('');
    }
  };

  return (
    <div className="bg-card border border-card rounded-2xl shadow-custom shadow-xl overflow-hidden mb-8">
      <div className="p-8">

        {/* DYNAMIC FORMS */}
        <div className="space-y-6 mb-8">

          {/* ADVANCED MODE TOGGLE */}
          {(activeTab === 'token' || activeTab === 'nft') && (
            <div className="mb-6 flex items-center animate-in fade-in duration-500">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isAdvancedMode} onChange={() => setIsAdvancedMode(!isAdvancedMode)} />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${isAdvancedMode ? 'bg-accent' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform ${isAdvancedMode ? 'translate-x-5' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-secondary">
                  Advanced Mode <span className="text-slate-500 font-normal ml-1">(Metadata & Artwork)</span>
                </div>
              </label>
            </div>
          )}

          {/* ADVANCED MODE FIELDS */}
          {isAdvancedMode && (activeTab === 'token' || activeTab === 'nft') && (
            <div className="p-6 bg-card/50 border border-indigo-500/30 rounded-xl animate-in slide-in-from-top-4 duration-300">
              <h4 className="text-accent font-medium mb-4 flex items-center gap-2">Advanced Settings</h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    {activeTab === 'nft' ? 'Artwork (PNG, JPG, GIF)' : 'Token Logo (PNG, JPG)'}
                  </label>
                  <input type="file" accept="image/png, image/jpeg, image/gif" onChange={(e) => setMediaFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer border border-card rounded-xl bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Detailed Description</label>
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={`Describe your ${activeTab === 'nft' ? 'NFT collection' : 'Token project'}...`} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" />
                </div>

                {/* Socials */}
                <div className="pt-4 border-t border-card">
                  <label className="block text-sm font-medium text-secondary mb-3">Socials & Links</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Website (e.g. https://...)" value={socials.website} onChange={(e) => setSocials({ ...socials, website: e.target.value })} className="w-full bg-background border border-card rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent/50" />
                    <input type="text" placeholder="X / Twitter (e.g. @project)" value={socials.twitter} onChange={(e) => setSocials({ ...socials, twitter: e.target.value })} className="w-full bg-background border border-card rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent/50" />
                    <input type="text" placeholder="Discord (Invite Link)" value={socials.discord} onChange={(e) => setSocials({ ...socials, discord: e.target.value })} className="w-full bg-background border border-card rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent/50" />
                    <input type="text" placeholder="Telegram" value={socials.telegram} onChange={(e) => setSocials({ ...socials, telegram: e.target.value })} className="w-full bg-background border border-card rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent/50" />
                    <input type="text" placeholder="Farcaster" value={socials.farcaster} onChange={(e) => setSocials({ ...socials, farcaster: e.target.value })} className="w-full bg-background border border-card rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent/50" />
                    <input type="text" placeholder="Github / Docs" value={socials.github} onChange={(e) => setSocials({ ...socials, github: e.target.value })} className="w-full bg-background border border-card rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent/50" />
                  </div>
                </div>

                {/* Royalties */}
                {activeTab === 'nft' && (
                  <div className="pt-4 border-t border-card">
                    <label className="block text-sm font-medium text-secondary mb-2">Royalties (OpenSea resales)</label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0" max="100" placeholder="Ex: 5" value={Number(royaltyFee) / 100} onChange={(e) => setRoyaltyFee((Number(e.target.value) * 100).toString())} className="w-24 bg-background border border-card rounded-xl p-3 text-foreground focus:outline-none focus:border-accent/50" />
                      <span className="text-secondary text-sm">% (sent to your address)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WHITE LABEL OPTION */}
          {(activeTab === 'token' || activeTab === 'nft') && (
            userCredits > 0 ? (
              <div className="p-5 bg-emerald-900/10 border border-emerald-500/50 rounded-xl animate-in fade-in duration-300 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div>
                  <h4 className="text-emerald-400 font-bold flex items-center gap-2 text-lg"><i className="fi fi-rr-gem"></i> Premium White Label</h4>
                  <p className="text-sm text-emerald-200/70 mt-1 max-w-[90%]">One credit will automatically be used to remove Forgenix branding. No additional ETH fees required.</p>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-5 py-3 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-3xl font-black leading-none">{userCredits}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Credits</span>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-card/30 border border-emerald-500/20 rounded-xl animate-in fade-in duration-300 flex items-center justify-between">
                <div>
                  <h4 className="text-emerald-400 font-medium flex items-center gap-2"><i className="fi fi-rr-gem"></i> White Label</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-[80%]">Removes Forgenix branding from your smart contracts.</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={requestWhiteLabel} onChange={(e) => { const isChecked = e.target.checked; setRequestWhiteLabel(isChecked); if (isChecked) setIsPricingModalOpen(true); }} />
                    <div className={`block w-12 h-7 rounded-full transition-colors ${requestWhiteLabel ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform ${requestWhiteLabel ? 'translate-x-5' : ''}`}></div>
                  </div>
                </label>
              </div>
            )
          )}

          {activeTab === 'message' && (
            <div className="animate-in fade-in duration-500">
              <label className="block text-sm font-medium text-secondary mb-2">Message to engrave</label>
              <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. GM Base!" />
            </div>
          )}

          {activeTab === 'token' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Token Name</label>
                <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. Forgenix Coin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Symbol</label>
                <input type="text" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. FRGX" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary mb-2">Total Supply</label>
                <input type="number" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. 1000000" />
              </div>
            </div>
          )}

          {activeTab === 'nft' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Collection Name</label>
                <input type="text" value={nftName} onChange={(e) => setNftName(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. Bored Ape" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Symbol</label>
                <input type="text" value={nftSymbol} onChange={(e) => setNftSymbol(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. BAPE" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary mb-2">Number of NFTs to mint</label>
                <input type="number" value={nftSupply} onChange={(e) => setNftSupply(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. 10" />
              </div>
            </div>
          )}

          {activeTab === 'simple' && (
            <div className="animate-in fade-in duration-500">
              <label className="block text-sm font-medium text-secondary mb-2">Contract Name</label>
              <input type="text" value={simpleName} onChange={(e) => setSimpleName(e.target.value)} className="w-full bg-background border border-card rounded-xl p-4 text-foreground focus:outline-none focus:border-accent/50" placeholder="e.g. MyContract" />
              <p className="mt-3 text-sm text-slate-500">Deploys a basic Smart Contract, ideal for quick on-chain interaction.</p>
            </div>
          )}
        </div>

        {/* ACTION ZONE */}
        <div className="bg-background border border-card rounded-xl p-6 flex flex-col items-center">
          <div className="flex justify-between w-full mb-6 text-sm">
            <span className="text-secondary">Service Fee</span>
            <span className="text-accent font-bold">{currentFeeString} ETH</span>
          </div>

          {!isConnected ? (
            <div className="text-center text-slate-500 font-medium">Connect your wallet.</div>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isLoading} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-accent text-foreground hover:bg-accent hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]'}`}>
              {isLoading ? 'Forging in progress...' : '⚡ Forge on Blockchain'}
            </button>
          )}
        </div>

        {error && <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">❌ {error}</div>}

        {/* EXTERNAL MODALS */}
        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setIsAdvancedMode(false); }}
          elementType={getElementType()}
          networkName={networkName}
          shareText={shareText}
          encodedShareText={encodedShareText}
          deployedAddress={deployedAddress}
          txHash={txHash}
          explorerUrl={explorerUrl}
          activeTab={activeTab}
          isAdvancedMode={isAdvancedMode}
        />

        <PricingWarningModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
        />
      </div>
    </div>
  );
}