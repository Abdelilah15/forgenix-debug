'use client';
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

// Vos constantes Web3
const FACTORY_ADDRESS = "0x2e4a6467C53103Ea0113A46c67b5D99912B6c60a";
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

export default function Forger({ initialTab }: { initialTab: string }) {
    const { isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState(initialTab);

    // Synchroniser l'onglet avec l'URL
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // États globaux
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');

    // États des formulaires
    const [msgText, setMsgText] = useState('GM Base!');
    const [tokenName, setTokenName] = useState('Mon Token');
    const [tokenSymbol, setTokenSymbol] = useState('MTK');
    const [tokenSupply, setTokenSupply] = useState('10000');
    const [nftName, setNftName] = useState('Ma Collection');
    const [nftSymbol, setNftSymbol] = useState('MCN');

    const handleCreate = async () => {
        setIsLoading(true);
        setError('');
        setTxHash('');

        try {
            if (!window.ethereum) throw new Error("Portefeuille non détecté");
            const provider = new ethers.BrowserProvider(window.ethereum as any);
            const signer = await provider.getSigner();
            const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
            
            // Commission ajustée à 0.00003 ETH
            const fee = ethers.parseEther("0.00003");
            let tx;

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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-8">
                
                {/* FORMULAIRES DYNAMIQUES */}
                <div className="space-y-6 mb-8">
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
                        </div>
                    )}
                </div>

                {/* ZONE D'ACTION */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
                    <div className="flex justify-between w-full mb-6 text-sm">
                        <span className="text-slate-400">Frais de service</span>
                        <span className="text-indigo-400 font-bold">0.00003 ETH</span>
                    </div>

                    {!isConnected ? (
                        <div className="text-center text-slate-500 font-medium">Connectez votre portefeuille.</div>
                    ) : (
                        <button onClick={handleCreate} disabled={isLoading} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]'}`}>
                            {isLoading ? 'Forge en cours...' : '⚡ Forger sur la Blockchain'}
                        </button>
                    )}
                </div>

                {/* RETOURS */}
                {txHash && (
                    <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-center">
                        🎉 Création réussie ! <br />
                        <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300 font-medium mt-2 inline-block">Voir sur Basescan</a>
                    </div>
                )}
                {error && <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">❌ {error}</div>}
            </div>
        </div>
    );
}