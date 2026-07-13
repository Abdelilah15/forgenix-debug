'use client';
import React, { useState } from 'react';
import { DeploymentRecord } from './DeploymentHistory';

interface DeploymentModalProps {
  record: DeploymentRecord;
  onClose: () => void;
  explorerUrl: string;
}

export default function DeploymentModal({ record, onClose, explorerUrl }: DeploymentModalProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-card border border-card w-full max-w-md rounded-2xl p-6 relative flex flex-col gap-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-background hover:bg-hover text-secondary transition-colors"
        >
          <i className="fi fi-rr-cross-small text-xl"></i>
        </button>

        {/* En-tête : Image + Nom/Symbole */}
        <div className="flex items-center gap-5 mt-2">
          {record.imageUrl ? (
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-background shrink-0 border border-card shadow-sm">
              <img src={record.imageUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-3xl shrink-0 border border-accent/20">
              <i className="fi fi-rr-document-signed"></i>
            </div>
          )}
          <div className="flex flex-col justify-center pr-6">
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {record.name || record.type}
            </h2>
            {record.symbol && (
              <span className="text-sm font-medium text-accent mt-1">
                {record.symbol}
              </span>
            )}
            <span className="text-xs font-semibold bg-background border border-card px-2 py-0.5 rounded-md text-secondary mt-2 w-fit">
              {record.type}
            </span>
          </div>
        </div>

        {/* Description avec See More */}
        {record.description && (
          <div className="text-sm text-secondary bg-background rounded-xl p-4 border border-card">
            <p className={`whitespace-pre-wrap ${!showFullDesc && record.description.length > 100 ? 'line-clamp-3' : ''}`}>
              {record.description}
            </p>
            {record.description.length > 100 && (
              <button 
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-accent font-medium mt-2 hover:underline text-xs"
              >
                {showFullDesc ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}

        {/* Liens Sociaux cliquables */}
        {record.socials && Object.keys(record.socials).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(record.socials).map(([platform, link]) => {
              if (!link) return null;
              return (
                <a 
                  key={platform} 
                  href={link as string} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-background border border-card hover:border-accent hover:text-accent text-secondary text-xs font-medium py-1.5 px-3 rounded-lg transition-colors capitalize flex items-center gap-1.5"
                >
                  <i className={`fi fi-brands-${platform === 'website' ? 'globe' : platform === 'twitter' ? 'twitter' : platform}`}></i>
                  {platform}
                </a>
              );
            })}
          </div>
        )}

        <div className="h-px bg-card w-full"></div>

        {/* Adresse et Liens d'exploration */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-background border border-card p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-secondary mb-1">Contract Address</span>
              <span className="text-sm text-foreground font-mono truncate w-78">
                {record.address}
              </span>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(record.address);
                alert('Copied!');
              }}
              className="bg-card hover:bg-hover text-foreground w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              title="Copy Address"
            >
              <i className="fi fi-rr-copy"></i>
            </button>
          </div>

          <div className="flex gap-2">
            <a 
              href={`${explorerUrl}/address/${record.address}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex-1 bg-[#2b7fff]/10 hover:bg-[#2b7fff]/20 text-[#2b7fff] text-sm py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <i className="fi fi-rr-search-alt"></i> Basescan
            </a>
            
            {(record.tabCategory === 'nft' || record.tabCategory === 'erc1155') && (
              <a 
                href={`https://testnets.opensea.io/assets/base-sepolia/${record.address}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-sm py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <i className="fi fi-rr-picture"></i> OpenSea
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}