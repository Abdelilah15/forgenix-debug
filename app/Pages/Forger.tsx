'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { FACTORY_ADDRESS, FACTORY_ABI } from '../lib/contracts';
import { useRouter } from 'next/navigation';

// Import our extracted components and logic
import SuccessModal from '../../components/forge/SuccessModal';
import PricingWarningModal from '../../components/forge/PricingWarningModal';
import { useDeployer } from '../../app/hooks/useDeployer';

export default function Forger({ initialTab }: { initialTab: string }) {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const {
    isLoading, txHash, error, explorerUrl, isModalOpen, setIsModalOpen,
    networkName, deployedAddress, deploy, resetStates
  } = useDeployer();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [userCredits, setUserCredits] = useState<number>(0);

  // States pour l'aperçu de l'image
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab & clean previous messages
  useEffect(() => {
    setActiveTab(initialTab);
    resetStates();
  }, [initialTab]);

  // Fetch Credits (On-Chain)
  useEffect(() => {
    const fetchCredits = async () => {
      if (!address) {
        setUserCredits(0);
        return;
      }
      try {
        const win = window as any;
        if (win.ethereum) {
          console.log("=== DEBUG FORGER CRÉDITS ===");
          console.log("Adresse utilisateur connecté :", address);
          console.log("Adresse du Factory ciblée :", FACTORY_ADDRESS);

          const provider = new ethers.BrowserProvider(win.ethereum);

          // Vérifions que le wallet est sur le bon réseau
          const network = await provider.getNetwork();
          console.log("Chain ID du Wallet Metamask :", network.chainId);

          const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

          // Appel on-chain
          const creditsBigInt = await factoryContract.getUserCredits(address);
          const creditsOnChain = Number(creditsBigInt);

          console.log("Crédits récupérés de la blockchain :", creditsOnChain);

          setUserCredits(creditsOnChain);
          if (creditsOnChain > 0) setRequestWhiteLabel(true);
        }
      } catch (error) {
        console.error("❌ Échec critique de la lecture des crédits :", error);
        setUserCredits(0);
      }
    };
    fetchCredits();
  }, [address]);

  // Form States
  const [msgText, setMsgText] = useState('GM Base!');
  const [tokenName, setTokenName] = useState('My Token');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [tokenSupply, setTokenSupply] = useState('10000');
  const [decimals, setDecimals] = useState('18');
  const [nftName, setNftName] = useState('My Collection');
  const [nftSymbol, setNftSymbol] = useState('MCN');
  const [nftSupply, setNftSupply] = useState('10');
  const [erc1155Amount, setErc1155Amount] = useState('100');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [simpleName, setSimpleName] = useState('My Contract');
  const [requestWhiteLabel, setRequestWhiteLabel] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [royaltyFee, setRoyaltyFee] = useState('500');
  const [socials, setSocials] = useState({ website: '', twitter: '', telegram: '', discord: '', farcaster: '', github: '', tags: '' });

  // Effacer l'aperçu si l'image est retirée (ex: après un déploiement réussi)
  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
    }
  }, [mediaFile]);

  const getElementType = () =>
    activeTab === 'message' ? 'Message' :
      activeTab === 'token' ? 'ERC-20 Token' :
        activeTab === 'b20' ? 'B20 Native Asset' :
          activeTab === 'nft' ? 'NFT' :
            activeTab === 'erc1155' ? 'ERC-1155 Edition' : 'Basic Contract';
  const shareText = `🚀 I just deployed a ${getElementType()} contract on ${networkName}!\n\nCreate yours: https://forgnix.vercel.app/forge?tab=${activeTab}\nTrack onchain activity: https://forgnix.vercel.app\n@monx`;
  const encodedShareText = encodeURIComponent(shareText);

  const calculateFee = () => {

    if (activeTab === 'b20') {
      let base = 0.00005; // B20_SIMPLE_MODE_FEE
      let wlSurcharge = 0;
      if (isAdvancedMode) {
        base = 0.0001; // B20_ADVANCED_MODE_FEE
        if (requestWhiteLabel && userCredits === 0) wlSurcharge = 0.0001; // WL_B20_ADVANCED_ADDITIONAL
      } else {
        if (requestWhiteLabel && userCredits === 0) wlSurcharge = 0.00005; // WL_B20_SIMPLE_ADDITIONAL
      }
      return (base + wlSurcharge).toFixed(5);
    }

    let base = 0.00003;
    let wlSurcharge = 0;
    if (isAdvancedMode && (activeTab === 'token' || activeTab === 'nft' || activeTab === 'erc1155')) {
      base = 0.0001;
      if (requestWhiteLabel && userCredits === 0) wlSurcharge = 0.00008;
    } else {
      if (requestWhiteLabel && userCredits === 0) wlSurcharge = 0.00005;
    }
    return (base + wlSurcharge).toFixed(5);
  };
  const currentFeeString = calculateFee();

  // Gestion du changement d'image pour générer l'aperçu
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setMediaFile(file);
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    const success = await deploy({
      activeTab, isAdvancedMode, mediaFile, description, nftName, tokenName,
      socials, requestWhiteLabel, msgText, simpleName, tokenSymbol, tokenSupply,
      nftSymbol, nftSupply, royaltyFee, currentFeeString, userCredits, erc1155Amount,
      decimals: parseInt(decimals) || 18,
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

  // Fonction de rendu dynamique pour les champs Token/NFT selon le mode
  const renderTokenOrNftFields = () => {
    const isToken = activeTab === 'token' || activeTab === 'b20';

    // Variables dynamiques selon le tab actif
    const nameVal = activeTab === 'token' || activeTab === 'b20' ? tokenName : nftName;
    const setName = activeTab === 'token' || activeTab === 'b20' ? setTokenName : setNftName;
    const symVal = activeTab === 'token' || activeTab === 'b20' ? tokenSymbol : nftSymbol;
    const setSym = activeTab === 'token' || activeTab === 'b20' ? setTokenSymbol : setNftSymbol;
    const supVal = activeTab === 'token' || activeTab === 'b20' ? tokenSupply : nftSupply;
    const setSup = activeTab === 'token' || activeTab === 'b20' ? setTokenSupply : setNftSupply;

    const nameLabel = activeTab === 'b20' ? 'B20 Asset Name' : isToken ? 'Token Name' : 'Collection Name';
    const namePlaceholder = activeTab === 'b20' ? 'e.g. Base Native Gold' : isToken ? 'e.g. Forgenix Coin' : 'e.g. Bored Ape';
    const symPlaceholder = activeTab === 'b20' ? 'e.g. BNG' : isToken ? 'e.g. FRGX' : 'e.g. BAPE';
    const supLabel = activeTab === 'b20' ? 'Initial Supply Cap' : isToken ? 'Total Supply' : 'Number of NFTs to mint';
    const supPlaceholder = isToken ? 'e.g. 1000000' : 'e.g. 10';
    const imageLabel = isToken ? 'Token Logo (PNG, JPG)' : 'Artwork (PNG, JPG, GIF)';

    if (isAdvancedMode) {
      return (
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">{nameLabel}</label>
                <input type="text" value={nameVal} onChange={(e) => setName(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder={namePlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Symbol</label>
                <input type="text" value={symVal} onChange={(e) => setSym(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder={symPlaceholder} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">{supLabel}</label>
                  <input type="number" value={supVal} onChange={(e) => setSup(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder={supPlaceholder} />
                </div>
                {activeTab === 'b20' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Decimals (6 - 18)</label>
                    <input type="number" min="6" max="18" value={decimals} onChange={(e) => setDecimals(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder="18" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-1 flex flex-col">
              <label className="block text-sm font-medium text-secondary mb-2">{imageLabel}</label>
              <div onClick={() => fileInputRef.current?.click()} className="group relative flex-grow aspect-square border-2 border-dashed border-card hover:border-accent/50 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors bg-background">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} />
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full absolute inset-0" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <span className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2"><i className="fi fi-rr-picture"></i> Changer l'image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-secondary group-hover:text-accent transition-colors p-4 text-center">
                    <i className="fi fi-rr-picture text-3xl mb-2"></i>
                    <span className="text-xs font-medium bg-card px-3 py-1.5 rounded-lg group-hover:bg-accent/10">Importer une image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // MODE STANDARD (Pas d'image)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">{nameLabel}</label>
          <input type="text" value={nameVal} onChange={(e) => setName(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder={namePlaceholder} />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Symbol</label>
          <input type="text" value={symVal} onChange={(e) => setSym(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder={symPlaceholder} />
        </div>
        <div className={activeTab === 'b20' ? "md:col-span-1" : "md:col-span-2"}>
          <label className="block text-sm font-medium text-secondary mb-2">{supLabel}</label>
          <input type="number" value={supVal} onChange={(e) => setSup(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder={supPlaceholder} />
        </div>
        {activeTab === 'b20' && (
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-secondary mb-2">Decimals (6 - 18)</label>
            <input type="number" min="6" max="18" value={decimals} onChange={(e) => setDecimals(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder="18" />
          </div>
        )}
      </div>
    );
  };

  const renderERC1155Fields = () => {
    if (isAdvancedMode) {
      return (
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col gap-2">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Edition Name (For Metadata)</label>
                <input type="text" value={nftName} onChange={(e) => setNftName(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder="e.g. Genesis Edition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Amount to Mint</label>
                <input type="number" value={erc1155Amount} onChange={(e) => setErc1155Amount(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder="e.g. 500" />
              </div>
            </div>
            <div className="md:col-span-1 flex flex-col">
              <label className="block text-sm font-medium text-secondary mb-2">Artwork (PNG, GIF)</label>
              <div onClick={() => fileInputRef.current?.click()} className="group relative flex-grow aspect-square border-2 border-dashed border-card hover:border-accent/50 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors bg-background">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} />
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full absolute inset-0" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <span className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2"><i className="fi fi-rr-picture"></i> Changer l'image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-secondary group-hover:text-accent transition-colors p-4 text-center">
                    <i className="fi fi-rr-picture text-3xl mb-2"></i>
                    <span className="text-xs font-medium bg-card px-3 py-1.5 rounded-lg group-hover:bg-accent/10">Importer une image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // En mode simple, on ne demande que le montant (pas de nom, pas d'IPFS)
    return (
      <div className="animate-in fade-in duration-500">
        <label className="block text-sm font-medium text-secondary mb-2">Amount to Mint</label>
        <input type="number" value={erc1155Amount} onChange={(e) => setErc1155Amount(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder="e.g. 100" />
      </div>
    );
  };

  return (
    <div className="bg-card border border-card rounded-2xl overflow-hidden mb-8">
      <div className="p-8">

        {/* DYNAMIC FORMS */}
        <div className="space-y-6 mb-8">

          {/* ADVANCED MODE TOGGLE */}
          {(activeTab === 'token' || activeTab === 'b20' || activeTab === 'nft' || activeTab === 'erc1155') && (
            <div className="mb-6 flex items-center animate-in fade-in duration-500">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isAdvancedMode} onChange={() => setIsAdvancedMode(!isAdvancedMode)} />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${isAdvancedMode ? 'bg-[#2b7fff]' : 'bg-[#1c398e]'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform ${isAdvancedMode ? 'translate-x-5' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-secondary">
                  Advanced Mode <span className="opacity-70 ml-1">(Metadata & Artwork)</span>
                </div>
              </label>
            </div>
          )}

          {/* WHITE LABEL OPTION */}
          {(activeTab === 'token' || activeTab === 'b20' || activeTab === 'nft' || activeTab === 'erc1155') && (
            userCredits > 0 ? (
              <div className="p-5 bg-emerald-500/10 rounded-xl animate-in fade-in duration-300 flex items-center justify-between">
                <div>
                  <h4 className="text-emerald-500 font-bold flex items-center gap-2 text-lg"><i className="fi fi-rr-gem"></i> Premium White Label</h4>
                  <p className="text-sm text-emerald-600/80 mt-1 max-w-[90%] dark:text-emerald-400/80">One credit will automatically be used to remove Forgenix branding. No additional ETH fees required.</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-500 px-5 py-3 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-3xl font-black leading-none">{userCredits}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Credits</span>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-background rounded-xl animate-in fade-in duration-300 flex items-center justify-between">
                <div>
                  <h4 className="text-accent font-medium flex items-center gap-2"><i className="fi fi-rr-gem"></i> White Label</h4>
                  <p className="text-sm text-secondary mt-1 max-w-[80%]">Removes Forgenix branding from your smart contracts.</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={requestWhiteLabel} onChange={(e) => { const isChecked = e.target.checked; setRequestWhiteLabel(isChecked); if (isChecked) setIsPricingModalOpen(true); }} />
                    <div className={`block w-12 h-7 rounded-full transition-colors ${requestWhiteLabel ? 'bg-[#2b7fff]' : 'bg-[#1c398e]'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform ${requestWhiteLabel ? 'translate-x-5' : ''}`}></div>
                  </div>
                </label>
              </div>
            )
          )}

          {activeTab === 'simple' && (
            <div className="animate-in fade-in duration-500">
              <label className="block text-sm font-medium text-secondary mb-2">Contract Name</label>
              <input type="text" value={simpleName} onChange={(e) => setSimpleName(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder="e.g. MyContract" />
              <p className="mt-3 text-sm text-secondary">Deploys a basic Smart Contract, ideal for quick on-chain interaction.</p>
            </div>
          )}

          {activeTab === 'message' && (
            <div className="animate-in fade-in duration-500">
              <label className="block text-sm font-medium text-secondary mb-2">Message to engrave</label>
              <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" placeholder="e.g. GM Base!" />
              <p className="mt-3 text-sm text-secondary">Engrave a message in blockchain</p>
            </div>
          )}

          {/* Rendu dynamique des champs Token ou NFT (gère le mode avancé et basique) */}
          {(activeTab === 'token' || activeTab === 'b20' || activeTab === 'nft') && renderTokenOrNftFields()}
          {activeTab === 'erc1155' && renderERC1155Fields()}

          {/* ADVANCED MODE FIELDS (Description & Socials) */}
          {isAdvancedMode && (activeTab === 'token' || activeTab === 'b20' || activeTab === 'nft' || activeTab === 'erc1155') && (
            <div className=" animate-in slide-in-from-top-4 duration-300 pt-2">
              <h4 className="text-accent font-medium mb-4 flex items-center gap-2">Advanced Settings</h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Detailed Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Describe your ${activeTab === 'nft' ? 'NFT collection' : 'Token project'}...`}
                    className="w-full border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
                {/* Socials */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-secondary mb-3">Socials & Links</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Website (e.g. https://...)" value={socials.website} onChange={(e) => setSocials({ ...socials, website: e.target.value })} className="w-full border border-card rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                    <input type="text" placeholder="X / Twitter (e.g. @project)" value={socials.twitter} onChange={(e) => setSocials({ ...socials, twitter: e.target.value })} className="w-full border border-card rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                    <input type="text" placeholder="Discord (Invite Link)" value={socials.discord} onChange={(e) => setSocials({ ...socials, discord: e.target.value })} className="w-full border border-card rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                    <input type="text" placeholder="Telegram" value={socials.telegram} onChange={(e) => setSocials({ ...socials, telegram: e.target.value })} className="w-full border border-card rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                    <input type="text" placeholder="Farcaster" value={socials.farcaster} onChange={(e) => setSocials({ ...socials, farcaster: e.target.value })} className="w-full border border-card rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                    <input type="text" placeholder="Github / Docs" value={socials.github} onChange={(e) => setSocials({ ...socials, github: e.target.value })} className="w-full border border-card rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                  </div>
                </div>

                {/* Royalties */}
                {(activeTab === 'nft' || activeTab === 'erc1155') && (
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-secondary mb-2">Royalties (OpenSea resales)</label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="0" max="100" placeholder="Ex: 5" value={Number(royaltyFee) / 100} onChange={(e) => setRoyaltyFee((Number(e.target.value) * 100).toString())} className="w-24 border border-card rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                      <span className="text-secondary text-sm">% (sent to your address)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ACTION ZONE - Flat UI */}
        <div className="p-6 flex flex-col items-center">
          <div className="flex justify-between w-full mb-4 text-sm">
            <span className="text-secondary">Service Fee</span>
            <span className="text-accent font-bold">{currentFeeString} ETH</span>
          </div>

          {!isConnected ? (
            <div className="text-center text-secondary font-medium">Connect your wallet.</div>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isLoading} className={`w-full py-4 rounded-xl bg-[#2b7fff] hover:bg-[#155dfc] font-bold text-lg transition-colors ${isLoading ? 'bg-card text-white cursor-not-allowed' : 'bg-accent text-white hover:bg-accent-hover'}`}>
              {isLoading ? 'Forging in progress...' : '⚡ Forge on Blockchain'}
            </button>
          )}
        </div>

        {error && <div className="mt-6 p-4 bg-red-500/10 rounded-xl text-red-500 font-medium text-sm text-center">{error}</div>}

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