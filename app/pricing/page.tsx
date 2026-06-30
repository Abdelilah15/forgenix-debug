'use client';
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import DashboardLayout from '@/components/DashboardLayout';

// --- ADRESSES À CONFIGURER ---
// Remplacez par l'adresse de votre FeeManager déployé
const FEE_MANAGER_ADDRESS = "0x1B299788876893038231f186Ccdaf092767916d2"; 

// Adresse USDC (Base Sepolia par défaut pour les tests, à changer pour le Mainnet)
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Faux USDC usuel sur Base Sepolia

// --- ABIs MINIMALES ---
const FEE_MANAGER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "consumeCredit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdcToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_initialOwner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "DeploymentFailed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenAddress",
        "type": "address"
      }
    ],
    "name": "emergencyWithdrawERC20",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdrawETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "expected",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "provided",
        "type": "uint256"
      }
    ],
    "name": "InsufficientFee",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAddress",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requiredFee",
        "type": "uint256"
      }
    ],
    "name": "processDirectFee",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "tier",
        "type": "uint8"
      }
    ],
    "name": "purchaseSubscription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_factory",
        "type": "address"
      }
    ],
    "name": "setFactoryAddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "SubscriptionNotActive",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      }
    ],
    "name": "UnauthorizedAccess",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "remainingCredits",
        "type": "uint256"
      }
    ],
    "name": "CreditConsumed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldFactory",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newFactory",
        "type": "address"
      }
    ],
    "name": "FactoryUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldRecipient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newRecipient",
        "type": "address"
      }
    ],
    "name": "FeeRecipientUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newRecipient",
        "type": "address"
      }
    ],
    "name": "setFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "creditsAdded",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountPaid",
        "type": "uint256"
      }
    ],
    "name": "SubscriptionPurchased",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "factoryAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasActiveSubscription",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SUB_100_PRICE",
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
    "name": "SUB_200_PRICE",
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
    "name": "SUB_50_PRICE",
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
    "name": "usdcToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

const TIERS = [
  { id: 1, name: "Découverte", credits: 50, price: 0.3, badge: "Populaire" },
  { id: 2, name: "Pro", credits: 100, price: 0.6, badge: "Rentable" },
  { id: 3, name: "Studio", credits: 200, price: 1.0, badge: "Meilleur Prix" }
];

export default function PricingPage() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const handlePurchase = async (tierId: number, credits: number, priceUSDC: number) => {
    setIsLoading(tierId);
    setError('');
    setStatusMsg('Vérification du portefeuille...');

    try {
      const win = window as any;
      if (!win.ethereum) throw new Error("Portefeuille non détecté");

      const provider = new ethers.BrowserProvider(win.ethereum);
      const signer = await provider.getSigner();
      
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const feeManagerContract = new ethers.Contract(FEE_MANAGER_ADDRESS, FEE_MANAGER_ABI, signer);

      // L'USDC utilise 6 décimales sur Base (0.3 USDC = 300000 unités)
      const decimals = await usdcContract.decimals();
      const amountToApprove = ethers.parseUnits(priceUSDC.toString(), decimals);

      // 1. Vérification du solde USDC
      setStatusMsg('Vérification du solde USDC...');
      const balance = await usdcContract.balanceOf(address);
      if (balance < amountToApprove) {
        throw new Error("Solde USDC insuffisant.");
      }

      // 2. Vérification de l'allocation (Allowance)
      setStatusMsg('Vérification des autorisations...');
      const allowance = await usdcContract.allowance(address, FEE_MANAGER_ADDRESS);
      
      // 3. Approbation (si nécessaire)
      if (allowance < amountToApprove) {
        setStatusMsg('Veuillez approuver la dépense USDC dans votre portefeuille...');
        const txApprove = await usdcContract.approve(FEE_MANAGER_ADDRESS, amountToApprove);
        await txApprove.wait();
      }

      // 4. Achat de l'abonnement
      setStatusMsg('Achat en cours, veuillez confirmer la transaction...');
      const txPurchase = await feeManagerContract.purchaseSubscription(tierId);
      const receipt = await txPurchase.wait();

      // 5. Sauvegarde en Base de données via notre nouvelle API
      setStatusMsg('Enregistrement de votre achat...');
      const apiRes = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: receipt.hash,
          walletAddress: address,
          tier: tierId,
          creditsAdded: credits,
          amountUSDC: priceUSDC
        })
      });

      if (!apiRes.ok) {
        console.warn("L'achat a réussi sur la blockchain, mais l'affichage distant a échoué.");
      }

      setStatusMsg('');
      alert(`🎉 Félicitations ! ${credits} crédits ont été ajoutés à votre compte.`);

    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "Une erreur est survenue lors de l'achat.");
      setStatusMsg('');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <DashboardLayout>
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Déployez en Marque Blanche
        </h2>
        <p className="mt-4 text-xl text-secondary">
          Achetez des crédits en USDC pour supprimer la mention "Créé avec Forgenix" de vos futurs Smart Contracts.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-center">
          ❌ {error}
        </div>
      )}
      
      {statusMsg && (
        <div className="mb-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-indigo-300 text-center flex justify-center items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TIERS.map((tier) => (
          <div key={tier.id} className="bg-card border border-card rounded-2xl p-8 shadow-custom flex flex-col relative overflow-hidden">
            {tier.badge && (
              <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                {tier.badge}
              </div>
            )}
            
            <h3 className="text-2xl font-semibold text-foreground">{tier.name}</h3>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold text-accent">
              {tier.price} <span className="ml-2 text-xl font-medium text-secondary">USDC</span>
            </div>
            <p className="mt-4 text-secondary">
              Obtenez <strong className="text-foreground">{tier.credits} crédits</strong> de déploiement en marque blanche.
            </p>
            
            <div className="mt-8 flex-1">
              <ul className="space-y-4">
                <li className="flex items-center text-secondary">
                  <span className="text-emerald-400 mr-2">✔</span> Sans mention Forgenix
                </li>
                <li className="flex items-center text-secondary">
                  <span className="text-emerald-400 mr-2">✔</span> Valable à vie
                </li>
              </ul>
            </div>

            <button
              onClick={() => handlePurchase(tier.id, tier.credits, tier.price)}
              disabled={isLoading !== null || !isConnected}
              className={`mt-8 w-full py-3 px-4 rounded-xl font-bold transition-all ${
                isLoading === tier.id 
                  ? 'bg-slate-800 text-slate-500 cursor-wait' 
                  : !isConnected 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent/90 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]'
              }`}
            >
              {isLoading === tier.id ? 'Traitement...' : isConnected ? 'Acheter' : 'Connectez-vous'}
            </button>
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}