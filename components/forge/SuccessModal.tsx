import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  elementType: string;
  networkName: string;
  shareText: string;
  encodedShareText: string;
  deployedAddress: string;
  txHash: string;
  explorerUrl: string;
  activeTab: string;
  isAdvancedMode: boolean;
}

export default function SuccessModal({
  isOpen,
  onClose,
  elementType,
  networkName,
  shareText,
  encodedShareText,
  deployedAddress,
  txHash,
  explorerUrl,
  activeTab,
  isAdvancedMode
}: SuccessModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-card rounded-2xl shadow-custom shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">

          <div className="flex justify-between items-start mb-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              🎉
            </div>
            <button onClick={onClose} className="text-secondary hover:text-foreground transition-colors p-2 bg-slate-800 rounded-xl">
              <i className="fi fi-rr-cross"></i>
            </button>
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-2">Deployment Successful!</h3>
          <p className="text-secondary mb-6">
            Your <span className="font-bold text-accent">{elementType}</span> contract has been deployed on <span className="font-bold text-accent">{networkName}</span>.
          </p>

          <div className="bg-background border border-card rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Share your achievement</p>

            <div className="w-full bg-card/50 border border-card rounded-xl p-4 text-sm text-secondary mb-4 whitespace-pre-wrap break-words leading-relaxed">
              {shareText}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareText);
                  alert("Message copied!");
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <i className="fi fi-rr-copy"></i> Copy Message
              </button>

              <div className="flex items-center gap-3 ml-2">
                <a href={`https://twitter.com/intent/tweet?text=${encodedShareText}`} target="_blank" rel="noreferrer" title="Share on X" className="text-secondary hover:text-foreground transition-transform hover:scale-110 w-[30px] h-[30px] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5">
            <p className="text-xs font-semibold text-indigo-300/70 mb-2 uppercase tracking-wide">
              {deployedAddress ? 'Contract Address' : 'Transaction Hash'}
            </p>
            <p className="text-sm font-mono text-indigo-300 bg-indigo-950/50 p-2 rounded break-all mb-4">
              {deployedAddress || txHash}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(deployedAddress || txHash);
                  alert("Address copied!");
                }}
                className="flex-1 bg-accent/20 hover:bg-accent/30 text-indigo-300 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <i className="fi fi-rr-copy"></i> Copy
              </button>
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-accent hover:bg-accent text-foreground font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <i className="fi fi-rr-search-alt"></i> Basescan
              </a>
            </div>

            {activeTab === 'nft' && isAdvancedMode && deployedAddress && (
              <a
                href={networkName === 'Base Mainnet'
                  ? `https://opensea.io/assets/base/${deployedAddress}`
                  : `https://testnets.opensea.io/assets/base-sepolia/${deployedAddress}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full group bg-white hover:bg-blue-500 text-black hover:text-foreground font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                View collection on OpenSea
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}