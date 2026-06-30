import { useState } from 'react';
import { ethers } from 'ethers';
import { FACTORY_ADDRESS, FACTORY_ABI } from '../lib/contracts';

// We define exactly what data the hook needs to execute a deployment
export interface DeployFormData {
  activeTab: string;
  isAdvancedMode: boolean;
  mediaFile: File | null;
  description: string;
  nftName: string;
  tokenName: string;
  socials: any;
  requestWhiteLabel: boolean;
  msgText: string;
  simpleName: string;
  tokenSymbol: string;
  tokenSupply: string;
  nftSymbol: string;
  nftSupply: string;
  royaltyFee: string;
  currentFeeString: string;
  userCredits: number;
  address: string | undefined;
  onCreditDeducted: (newCredits: number) => void;
}

export function useDeployer() {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('https://sepolia.basescan.org');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [networkName, setNetworkName] = useState('Base Sepolia');
  const [deployedAddress, setDeployedAddress] = useState('');

  const resetStates = () => {
    setTxHash('');
    setError('');
    setIsModalOpen(false);
  };

  const uploadToIPFS = async (data: DeployFormData): Promise<string> => {
    if (!data.mediaFile) throw new Error("Please select a file (Artwork or Logo).");

    const formData = new FormData();
    formData.append("file", data.mediaFile);

    const fileRes = await fetch("/api/ipfs/file", { method: "POST", body: formData });
    if (!fileRes.ok) throw new Error("Image upload failed.");
    const fileData = await fileRes.json();
    const imageUrl = `ipfs://${fileData.ipfsHash}`;

    const metadata = {
      name: data.activeTab === 'nft' ? data.nftName : data.tokenName,
      description: data.description,
      image: imageUrl,
      external_link: data.socials.website,
      attributes: [
        { trait_type: "Twitter", value: data.socials.twitter },
        { trait_type: "Discord", value: data.socials.discord },
        { trait_type: "Farcaster", value: data.socials.farcaster },
        { trait_type: "Telegram", value: data.socials.telegram },
        { trait_type: "Github", value: data.socials.github },
        { trait_type: "Tags", value: data.socials.tags },
      ],
      isWhiteLabeled: data.requestWhiteLabel 
    };

    const jsonRes = await fetch("/api/ipfs/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });

    if (!jsonRes.ok) throw new Error("Metadata upload failed.");
    const jsonData = await jsonRes.json();
    return `ipfs://${jsonData.ipfsHash}`;
  };

  const deploy = async (data: DeployFormData) => {
    setIsLoading(true);
    resetStates();

    try {
      const win = window as any;
      if (!win.ethereum) throw new Error("Wallet not detected");

      const provider = new ethers.BrowserProvider(win.ethereum);
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
      const fee = ethers.parseEther(data.currentFeeString);

      let tx;
      let metadataURI = "";

      if (data.isAdvancedMode && (data.activeTab === 'token' || data.activeTab === 'nft')) {
        metadataURI = await uploadToIPFS(data);
      }

      if (data.activeTab === 'message') {
        tx = await factoryContract.deployMessage(data.msgText, { value: fee });
      } else if (data.activeTab === 'simple') {
        tx = await factoryContract.deploySimpleContract(data.simpleName, { value: fee });
      } else if (data.activeTab === 'token') {
        if (data.isAdvancedMode) {
          tx = await factoryContract.deployAdvancedERC20(data.tokenName, data.tokenSymbol, data.tokenSupply, metadataURI, data.requestWhiteLabel, { value: fee });
        } else {
          tx = await factoryContract.deploySimpleERC20(data.tokenName, data.tokenSymbol, data.tokenSupply, data.requestWhiteLabel, { value: fee });
        }
      } else if (data.activeTab === 'nft') {
        if (data.isAdvancedMode) {
          tx = await factoryContract.deployAdvancedNFT(data.nftName, data.nftSymbol, data.nftSupply, metadataURI, data.royaltyFee, data.requestWhiteLabel, { value: fee });
        } else {
          tx = await factoryContract.deploySimpleNFT(data.nftName, data.nftSymbol, data.nftSupply, data.requestWhiteLabel, { value: fee });
        }
      }

      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      let extractedAddress = '';
      for (const log of receipt.logs) {
        try {
          const parsed = factoryContract.interface.parseLog(log);
          if (parsed && parsed.name === 'ProxyDeployed') {
            extractedAddress = parsed.args[0]; 
            break;
          }
        } catch (err) { }
      }

      // Deduct credit in database if applicable
      if (data.requestWhiteLabel && data.userCredits > 0 && (data.activeTab === 'token' || data.activeTab === 'nft')) {
        try {
          const res = await fetch('/api/user', {
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: data.address })
          });
          
          if (res.ok) {
            const apiData = await res.json();
            if (apiData.credits !== undefined) {
              data.onCreditDeducted(apiData.credits);
            }
          }
        } catch (dbErr) {
          console.error("Network error while deducting credit off-chain", dbErr);
        }
      }

      setIsModalOpen(true);
      setDeployedAddress(extractedAddress);
      
      // Return true to indicate success so the component can clear its form fields
      return true;

    } catch (error: any) {
      console.error(error);
      setError(error.reason || error.message || "A transaction error occurred.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading, txHash, error, explorerUrl, isModalOpen, setIsModalOpen, 
    networkName, deployedAddress, deploy, resetStates
  };
}