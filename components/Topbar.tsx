import react from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface TopbarProps {
    activeTab: string;
}

export default function Topbar({ activeTab }: TopbarProps) {
    return (
    <header className="h-20 border-b border-slate-800 bg-slate-950/80 px-8 flex justify-between items-center z-10 flex-shrink-0">
      <h2 className="text-lg font-semibold text-slate-300">
        {activeTab === 'message' && "Déployer un Message On-Chain"}
        {activeTab === 'token' && "Créer un Token ERC-20"}
        {activeTab === 'nft' && "Lancer une Collection NFT"}
      </h2>
      <ConnectButton />
    </header>
  );
}