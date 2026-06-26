'use client';
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

// ⚠️ À REMPLACER PAR VOTRE NOUVELLE ADRESSE ET VOTRE NOUVEL ABI APRÈS LE DÉPLOIEMENT
const FACTORY_ADDRESS = "0x93a3646d3A81c7fB98cD5D9A1703E848B1ef0205";
const FACTORY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "contractType",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "ContractCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "supply",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "createAdvancedNFT",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "supply",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "createAdvancedToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "text",
        "type": "string"
      }
    ],
    "name": "createMessage",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "supply",
        "type": "uint256"
      }
    ],
    "name": "createNFT",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "createSimpleContract",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "supply",
        "type": "uint256"
      }
    ],
    "name": "createToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ADVANCED_FEE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ownerFeeAddress",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "STANDARD_FEE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function Forger({ initialTab }: { initialTab: string }) {
  const { isConnected } = useAccount();


  const [activeTab, setActiveTab] = useState(initialTab);

  // États globaux
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('https://sepolia.basescan.org');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [networkName, setNetworkName] = useState('Base Sepolia');
  const [deployedAddress, setDeployedAddress] = useState('');

  // Synchroniser l'onglet et nettoyer les messages de la transaction précédente
  useEffect(() => {
    setActiveTab(initialTab);
    setTxHash('');
    setError('');
    setIsModalOpen(false);
  }, [initialTab]);

  // États des formulaires
  const [msgText, setMsgText] = useState('GM Base!');

  const [tokenName, setTokenName] = useState('Mon Token');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [tokenSupply, setTokenSupply] = useState('10000');

  const [nftName, setNftName] = useState('Ma Collection');
  const [nftSymbol, setNftSymbol] = useState('MCN');
  const [nftSupply, setNftSupply] = useState('10'); // <-- Quantité pour NFT intégrée
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [simpleName, setSimpleName] = useState('Mon Contrat')
  const getElementType = () =>
    activeTab === 'message' ? 'Message' :
      activeTab === 'token' ? 'Token ERC-20' :
        activeTab === 'nft' ? 'NFT' : 'Contrat Simple';

  const shareText = `🚀 I just deployed a ${getElementType()} contract on ${networkName}!\n\nCreate yours: https://forgnix.vercel.app/forge?tab=${activeTab}\nTrack onchain activity: https://forgnix.vercel.app\n@monx`;
  const encodedShareText = encodeURIComponent(shareText);
  const currentFeeString = (isAdvancedMode && (activeTab === 'token' || activeTab === 'nft')) ? "0.0002" : "0.00003";

  const handleIPFSUpload = async (): Promise<string> => {
    if (!mediaFile) throw new Error("Veuillez sélectionner un fichier (Artwork ou Logo).");

    // 1. Upload de l'image via l'API interne sécurisée
    const formData = new FormData();
    formData.append("file", mediaFile);

    const fileRes = await fetch("/api/ipfs/file", {
      method: "POST",
      body: formData,
    });

    if (!fileRes.ok) throw new Error("Échec de l'upload de l'image vers IPFS.");
    const fileData = await fileRes.json();
    const imageUrl = `ipfs://${fileData.ipfsHash}`;

    // 2. Formatage standard ERC-721/1155 (OpenSea standard)
    const metadata = {
      name: activeTab === 'nft' ? nftName : tokenName,
      description: description,
      image: imageUrl,
      attributes: [
        { trait_type: "Déploiement", value: "Forgenix Advanced" }
      ]
    };

    // 3. Upload du JSON final
    const jsonRes = await fetch("/api/ipfs/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });

    if (!jsonRes.ok) throw new Error("Échec de l'upload des métadonnées.");
    const jsonData = await jsonRes.json();

    return `ipfs://${jsonData.ipfsHash}`;
  };

  const handleCreate = async () => {
    setIsLoading(true);
    setError('');
    setTxHash('');
    setIsModalOpen(false);
    setIsAdvancedMode(false);
    setMediaFile(null);
    setDescription('');

    try {
      // Astuce TypeScript pour Vercel : on force le type de window
      const win = window as any;
      if (!win.ethereum) throw new Error("Portefeuille non détecté");

      const provider = new ethers.BrowserProvider(win.ethereum);

      // Détection intelligente du réseau (Mainnet vs Sepolia)
      const network = await provider.getNetwork();
      if (Number(network.chainId) === 8453) {
        setExplorerUrl('https://basescan.org');
        setNetworkName('Base Mainnet');
      } else {
        setExplorerUrl('https://sepolia.basescan.org');
        setNetworkName('Base Sepolia');
      }

      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      const fee = ethers.parseEther(currentFeeString);
      let tx;
      let finalTokenURI = "";

      if (isAdvancedMode && (activeTab === 'token' || activeTab === 'nft')) {
        finalTokenURI = await handleIPFSUpload();
      }

      if (activeTab === 'message') {
        tx = await factoryContract.createMessage(msgText, { value: fee });

      } else if (activeTab === 'token') {
        if (isAdvancedMode) {
          tx = await factoryContract.createAdvancedToken(tokenName, tokenSymbol, tokenSupply, finalTokenURI, { value: fee });
        } else {
          tx = await factoryContract.createToken(tokenName, tokenSymbol, tokenSupply, { value: fee });
        }

      } else if (activeTab === 'nft') {
        if (isAdvancedMode) {
          tx = await factoryContract.createAdvancedNFT(nftName, nftSymbol, nftSupply, finalTokenURI, { value: fee });
        } else {
          tx = await factoryContract.createNFT(nftName, nftSymbol, nftSupply, { value: fee });
        }

      } else if (activeTab === 'simple') {
        tx = await factoryContract.createSimpleContract(simpleName, { value: fee });
      } else {
        throw new Error("L'ABI du Smart Contract doit être mise à jour pour supporter le Contrat Simple.");
      }

      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      // Extraction de l'adresse du contrat généré depuis les logs
      let extractedAddress = '';
      try {
        for (const log of receipt.logs) {
          const parsed = factoryContract.interface.parseLog(log);
          if (parsed && parsed.name === 'ContractCreated') {
            extractedAddress = parsed.args[0]; // La première variable est contractAddress
            break;
          }
        }
      } catch (err) {
        console.error("Impossible de parser les logs", err);
      }

      setDeployedAddress(extractedAddress);
      setIsModalOpen(true); // Ouvre la fenêtre de succès !

    } catch (error: unknown) {
      console.error(error);
      const err = error as { reason?: string; message?: string };
      setError(err.reason || err.message || "Une erreur est survenue lors de la transaction.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      <div className="p-8">

        {/* FORMULAIRES DYNAMIQUES */}
        <div className="space-y-6 mb-8">

          {/* TOGGLE MODE AVANCÉ (Uniquement pour Token et NFT) */}
          {(activeTab === 'token' || activeTab === 'nft') && (
            <div className="mb-6 flex items-center animate-in fade-in duration-500">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isAdvancedMode}
                    onChange={() => setIsAdvancedMode(!isAdvancedMode)}
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${isAdvancedMode ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform ${isAdvancedMode ? 'translate-x-5' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-slate-300">
                  Mode Avancé <span className="text-slate-500 font-normal ml-1">(Métadonnées & Artwork)</span>
                </div>
              </label>
            </div>
          )}

          {/* CHAMPS DU MODE AVANCÉ */}
          {isAdvancedMode && (activeTab === 'token' || activeTab === 'nft') && (
            <div className="p-6 bg-slate-900/50 border border-indigo-500/30 rounded-xl animate-in slide-in-from-top-4 duration-300">
              <h4 className="text-indigo-400 font-medium mb-4 flex items-center gap-2">
                Paramètres Avancés
              </h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {activeTab === 'nft' ? 'Artwork (PNG, JPG, GIF)' : 'Logo du Token (PNG, JPG)'}
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={(e) => setMediaFile(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-slate-400
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-500/10 file:text-indigo-400
                      hover:file:bg-indigo-500/20 cursor-pointer
                      border border-slate-700 rounded-lg bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Description détaillée</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Décrivez votre ${activeTab === 'nft' ? 'collection NFT' : 'projet de Token'}...`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'message' && (
            <div className="animate-in fade-in duration-500">
              <label className="block text-sm font-medium text-slate-400 mb-2">Message à graver</label>
              <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: GM Base!" />
            </div>
          )}

          {activeTab === 'token' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nom du Token</label>
                <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: Forgenix Coin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Symbole</label>
                <input type="text" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: FRGX" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Quantité Totale</label>
                <input type="number" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: 1000000" />
              </div>
            </div>
          )}

          {activeTab === 'nft' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nom de la Collection</label>
                <input type="text" value={nftName} onChange={(e) => setNftName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: Bored Ape" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Symbole</label>
                <input type="text" value={nftSymbol} onChange={(e) => setNftSymbol(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: BAPE" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Quantité de NFTs à générer</label>
                <input type="number" value={nftSupply} onChange={(e) => setNftSupply(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: 10" />
              </div>
            </div>
          )}

          {/* NOUVEAU: Formulaire Contrat Simple */}
          {activeTab === 'simple' && (
            <div className="animate-in fade-in duration-500">
              <label className="block text-sm font-medium text-slate-400 mb-2">Nom du Contrat</label>
              <input type="text" value={simpleName} onChange={(e) => setSimpleName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: MonContratDeBase" />
              <p className="mt-3 text-sm text-slate-500">
                Déploie un Smart Contract basique, idéal pour interagir rapidement avec le réseau sans complexité.
              </p>
            </div>
          )}

        </div>

        {/* ZONE D'ACTION */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
          <div className="flex justify-between w-full mb-6 text-sm">
            <span className="text-slate-400">Frais de service</span>
            <span className="text-indigo-400 font-bold">{currentFeeString} ETH</span>
          </div>

          {!isConnected ? (
            <div className="text-center text-slate-500 font-medium">Connectez votre portefeuille.</div>
          ) : (
            <button onClick={handleCreate} disabled={isLoading} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]'}`}>
              {isLoading ? 'Forge en cours...' : '⚡ Forger sur la Blockchain'}
            </button>
          )}
        </div>

        {error && <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">❌ {error}</div>}

        {/* 🔥 MODAL DE SUCCÈS (Félicitations & Partage) 🔥 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8">

                {/* En-tête du Modal */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    🎉
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-lg">
                    <i className="fi fi-rr-cross"></i>
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Deployment Successful!</h3>
                <p className="text-slate-300 mb-6">
                  Your <span className="font-bold text-indigo-400">{getElementType()}</span> contract has been deployed on <span className="font-bold text-indigo-400">{networkName}</span>.
                </p>

                {/* Zone de Partage */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Share your achievement</p>

                  {/* Utilisation d'un Div avec 'whitespace-pre-wrap' pour un auto-ajustement parfait sans scrollbar */}
                  <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 mb-4 whitespace-pre-wrap break-words leading-relaxed">
                    {shareText}
                  </div>

                  {/* Boutons de réseaux sociaux */}
                  <div className="flex items-center gap-3 ">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareText);
                        alert("Message copié !");
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <i className="fi fi-rr-copy"></i> Copier le message
                    </button>

                    {/* Liens pré-remplis avec des icônes SVG 100% autonomes */}
                    <div className="flex items-center gap-3 ml-2">
                      {/* X (Twitter) */}
                      <a href={`https://twitter.com/intent/tweet?text=${encodedShareText}`} target="_blank" rel="noreferrer" title="Partager sur X" className="text-slate-300 hover:text-white transition-transform hover:scale-110 w-[30px] h-[30px] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>

                      {/* Farcaster */}
                      <a href={`https://warpcast.com/~/compose?text=${encodedShareText}`} target="_blank" rel="noreferrer" title="Partager sur Farcaster" className="text-[#8a63d2] hover:text-[#9b78dd] transition-transform hover:scale-110 w-[30px] h-[30px] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                          <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724" />
                        </svg>
                      </a>

                      {/* Facebook */}
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=https://forgnix.vercel.app/forge&quote=${encodedShareText}`} target="_blank" rel="noreferrer" title="Partager sur Facebook" className="text-[#1877F2] hover:text-[#3b8ef5] transition-transform hover:scale-110 w-[30px] h-[30px] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>

                      {/* Telegram */}
                      <a href={`https://t.me/share/url?url=https://forgnix.vercel.app/forge&text=${encodedShareText}`} target="_blank" rel="noreferrer" title="Envoyer sur Telegram" className="text-[#2AABEE] hover:text-[#4ebdf8] transition-transform hover:scale-110 w-[30px] h-[30px] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                      </a>

                      {/* WhatsApp */}
                      <a href={`https://api.whatsapp.com/send?text=${encodedShareText}`} target="_blank" rel="noreferrer" title="Envoyer sur WhatsApp" className="text-[#25D366] hover:text-[#45e07e] transition-transform hover:scale-110 w-[30px] h-[30px] flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Zone du Contrat Déployé */}
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5">
                  <p className="text-xs font-semibold text-indigo-300/70 mb-2 uppercase tracking-wide">
                    {deployedAddress ? 'Adresse du Contrat' : 'Hash de la Transaction'}
                  </p>
                  <p className="text-sm font-mono text-indigo-300 bg-indigo-950/50 p-2 rounded break-all mb-4">
                    {deployedAddress || txHash}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(deployedAddress || txHash);
                        alert("Adresse copiée !");
                      }}
                      className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fi fi-rr-copy"></i> Copier
                    </button>
                    <a
                      href={`${explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fi fi-rr-search-alt"></i> Basescan
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}