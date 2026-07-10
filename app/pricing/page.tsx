'use client';
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import DashboardLayout from '../../components/DashboardLayout';

// --- CONFIGURATION ---
const FEE_MANAGER_ADDRESS = "0x1204fabcbc9d04d334ed731f5089b0478764c1c3"; 
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; 

const FEE_MANAGER_ABI = [
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
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
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
      "name": "getUserCredits",
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
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
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
  { id: 1, name: "Starter", credits: 50, price: 0.3, badge: "Popular" },
  { id: 2, name: "Pro", credits: 100, price: 0.6, badge: "Best Value" },
  { id: 3, name: "Studio", credits: 200, price: 1.0, badge: "Best Price" }
];

export default function PricingPage() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const handlePurchase = async (tierId: number, credits: number, priceUSDC: number) => {
    setIsLoading(tierId);
    setError('');
    setStatusMsg('Checking wallet...');

    try {
      const win = window as any;
      if (!win.ethereum) throw new Error("Wallet not detected");

      const provider = new ethers.BrowserProvider(win.ethereum);
      const signer = await provider.getSigner();
      
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const feeManagerContract = new ethers.Contract(FEE_MANAGER_ADDRESS, FEE_MANAGER_ABI, signer);

      const decimals = await usdcContract.decimals();
      const amountToApprove = ethers.parseUnits(priceUSDC.toString(), decimals);

      setStatusMsg('Checking USDC balance...');
      const balance = await usdcContract.balanceOf(address);
      if (balance < amountToApprove) {
        throw new Error("Insufficient USDC balance.");
      }

      setStatusMsg('Checking allowances...');
      const allowance = await usdcContract.allowance(address, FEE_MANAGER_ADDRESS);
      
      if (allowance < amountToApprove) {
        setStatusMsg('Please approve USDC spending in your wallet...');
        const txApprove = await usdcContract.approve(FEE_MANAGER_ADDRESS, amountToApprove);
        await txApprove.wait();
      }

      setStatusMsg('Purchase in progress, please confirm the transaction...');
      const txPurchase = await feeManagerContract.purchaseSubscription(tierId);
      const receipt = await txPurchase.wait();

      setStatusMsg('');
      alert(`🎉 Congratulations! ${credits} credits have been added to your account.`);

    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "An error occurred during the purchase.");
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
          Deploy with White Label
        </h2>
        <p className="mt-4 text-xl text-secondary">
          Purchase USDC credits to remove "Created with Forgenix" from your future Smart Contracts.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 text-red-500 rounded-xl text-center font-medium">
          {error}
        </div>
      )}
      
      {statusMsg && (
        <div className="mb-8 p-4 bg-accent/10 text-accent rounded-xl text-center flex justify-center items-center gap-3 font-medium">
          <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => (
          // Flat design card
          <div key={tier.id} className="bg-card border border-card rounded-2xl p-6 flex flex-col relative overflow-hidden">
            {tier.badge && (
              <div className="absolute top-0 right-0 bg-[#2b7fff] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                {tier.badge}
              </div>
            )}
            
            <h3 className="text-2xl font-semibold text-foreground">{tier.name}</h3>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold text-accent">
              {tier.price} <span className="ml-2 text-xl font-medium text-secondary">USDC</span>
            </div>
            <p className="mt-4 text-secondary">
              Get <strong className="text-foreground">{tier.credits} credits</strong> for white-label deployments.
            </p>
            
            <div className="mt-8 flex-1">
              <ul className="space-y-3">
                <li className="flex items-center text-secondary">
                  <span className="text-emerald-500 mr-2">✔</span> No Forgenix branding
                </li>
                <li className="flex items-center text-secondary">
                  <span className="text-emerald-500 mr-2">✔</span> 5 credits per deployment
                </li>
                <li className="flex items-center text-secondary">
                  <span className="text-emerald-500 mr-2">✔</span> Valid for life
                </li>
              </ul>
            </div>

            <button
              onClick={() => handlePurchase(tier.id, tier.credits, tier.price)}
              disabled={isLoading !== null || !isConnected}
              className={`mt-8 w-full py-3 px-4 bg-[#2b7fff] hover:bg-[#1a5fc0] text-white rounded-xl font-bold transition-colors cursor-pointer ${
                isLoading === tier.id 
                  ? 'bg-background text-secondary cursor-wait' 
                  : !isConnected 
                    ? 'bg-background text-secondary cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-hover'
              }`}
            >
              {isLoading === tier.id ? 'Processing...' : isConnected ? 'Purchase' : 'Connect Wallet'}
            </button>
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}