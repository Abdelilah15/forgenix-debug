import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-20 border-b border-slate-800 bg-slate-950/80 px-8 flex justify-between items-center z-10 flex-shrink-0">
      <h2 className="text-lg font-semibold text-slate-300">
        {title || "Forgenix"}
      </h2>
      <ConnectButton />
    </header>
  );
}