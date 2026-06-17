'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

// ==========================================
// ⚠️ 1. COLLEZ L'ADRESSE DE VOTRE USINE ICI
// ==========================================
const FACTORY_ADDRESS = "0x2e4a6467C53103Ea0113A46c67b5D99912B6c60a";

// ==========================================
// ⚠️ 2. COLLEZ L'ABI DE FORGENIXFACTORY ICI
// ==========================================
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
    "name": "SERVICE_FEE",
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

export default function Home() {
  const { isConnected } = useAccount();
  
  // États pour la navigation et l'interface
  const [activeTab, setActiveTab] = useState('message');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // États pour les formulaires
  const [msgText, setMsgText] = useState('GM Base!');
  const [tokenName, setTokenName] = useState('Mon Token');
  const [tokenSymbol, setTokenSymbol] = useState('MTK');
  const [tokenSupply, setTokenSupply] = useState('10000');
  const [nftName, setNftName] = useState('Ma Collection');
  const [nftSymbol, setNftSymbol] = useState('MCN');

  // Fonction principale de création
  const handleCreate = async () => {
    setIsLoading(true);
    setError('');
    setTxHash('');

    try {
      if (!window.ethereum) throw new Error("Portefeuille non détecté");
      
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      // On se connecte à VOTRE usine déjà déployée
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      
      const fee = ethers.parseEther("0.00003");
      let tx;

      // On appelle la bonne fonction selon l'onglet choisi
      if (activeTab === 'message') {
        tx = await factoryContract.createMessage(msgText, { value: fee });
      } else if (activeTab === 'token') {
        tx = await factoryContract.createToken(tokenName, tokenSymbol, tokenSupply, { value: fee });
      } else if (activeTab === 'nft') {
        tx = await factoryContract.createNFT(nftName, nftSymbol, { value: fee });
      }

      const receipt = await tx.wait();
      setTxHash(receipt.hash);

    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "Une erreur est survenue lors de la transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-xl font-bold text-white">F</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Forgenix
            </h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-white mb-4">La Forge Web3 Ultime</h2>
          <p className="text-slate-400 text-lg">Déployez des contrats intelligents optimisés en un clic. <br/>Frais de réseau réduits. Zéro code requis.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* ONGLETS DE NAVIGATION */}
          <div className="flex border-b border-slate-800 bg-slate-900/80">
            {[
              { id: 'message', label: 'Message On-Chain' },
              { id: 'token', label: 'Token ERC-20' },
              { id: 'nft', label: 'Collection NFT' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === tab.id 
                  ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ZONE DE FORMULAIRE */}
          <div className="p-8">
            <div className="space-y-6 mb-8">
              
              {activeTab === 'message' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Message à graver sur la blockchain</label>
                  <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: GM Base!" />
                </div>
              )}

              {activeTab === 'token' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Nom du Token</label>
                    <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: Forgenix Coin" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Symbole</label>
                    <input type="text" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: FRGX" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Quantité Totale (Supply)</label>
                    <input type="number" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: 1000000" />
                  </div>
                </div>
              )}

              {activeTab === 'nft' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Nom de la Collection</label>
                    <input type="text" value={nftName} onChange={(e) => setNftName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: Bored Ape" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Symbole</label>
                    <input type="text" value={nftSymbol} onChange={(e) => setNftSymbol(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: BAPE" />
                  </div>
                </div>
              )}

            </div>

            {/* ZONE D'ACTION */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
              <div className="flex justify-between w-full mb-6 text-sm">
                <span className="text-slate-400">Frais de service Forgenix</span>
                <span className="text-indigo-400 font-bold">0.00003 ETH</span>
              </div>

              {!isConnected ? (
                <div className="text-center text-slate-500 font-medium">Veuillez connecter votre portefeuille pour forger.</div>
              ) : (
                <button 
                  onClick={handleCreate}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isLoading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]'
                  }`}
                >
                  {isLoading ? 'Forge en cours (Validez dans votre portefeuille)...' : '⚡ Forger sur la Blockchain'}
                </button>
              )}
            </div>

            {/* MESSAGES DE RETOUR */}
            {txHash && (
              <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-center">
                🎉 Création réussie ! <br/>
                <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300 font-medium mt-2 inline-block">
                  Voir la transaction sur Basescan
                </a>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                ❌ {error}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </main>
  );
}