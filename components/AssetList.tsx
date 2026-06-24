import React, { useState, useMemo, useRef, useEffect } from 'react';

const NetworkAvatar = ({ name, iconUrl, className = "" }: { name: string, iconUrl?: string, className?: string }) => {
    const [hasError, setHasError] = useState(false);

    // ❌ Plus de pastille ! S'il n'y a pas d'image, on utilise le globe
    if (hasError || !iconUrl) {
        return (
            <img src="/globe.svg" alt="Default Network" className={`object-cover bg-slate-800 p-[2px] ${className}`} />
        );
    }

    return (
        <img 
            src={iconUrl} 
            alt={name} 
            className={`object-cover bg-slate-900 ${className}`} 
            onError={() => setHasError(true)} 
        />
    );
};

export default function AssetList({ assets }: { assets: any[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNetworkId, setSelectedNetworkId] = useState('Tous');
    const [selectedAsset, setSelectedAsset] = useState('Tokens');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Extraction des réseaux possédés (on utilise maintenant chainId et chainName)
    const networks = useMemo(() => {
        const uniqueNetworks = new Map();
        assets.forEach(a => {
            if (a.chainId && a.chainId !== "unknown") {
                uniqueNetworks.set(a.chainId, { id: a.chainId, name: a.chainName, icon: a.chainIcon });
            }
        });
        return [{ id: 'Tous', name: 'Tous les réseaux', icon: null }, ...Array.from(uniqueNetworks.values())];
    }, [assets]);

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesNetwork = selectedNetworkId === 'Tous' || asset.chainId === selectedNetworkId;
            
            // Séparation stricte
            const matchesTab = selectedAsset === 'Tokens' 
                ? asset.positionType === 'wallet' 
                : selectedAsset === 'DeFi' 
                    ? asset.positionType === 'defi' 
                    : false;

            return matchesSearch && matchesNetwork && matchesTab;
        });
    }, [assets, searchTerm, selectedNetworkId, selectedAsset]);

    const activeNetwork = networks.find(n => n.id === selectedNetworkId) || networks[0];

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <div>
                    <button onClick={() => setSelectedAsset('Tokens')} className={`border border-slate-700 rounded-l-lg px-3 py-2 text-sm focus:outline-none transition-colors ${selectedAsset === 'Tokens' ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50"}`}>Tokens</button>
                    <button onClick={() => setSelectedAsset('DeFi')} className={`border-t border-b border-slate-700 px-3 py-2 text-sm focus:outline-none transition-colors ${selectedAsset === 'DeFi' ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50"}`}>DeFi</button>
                    <button onClick={() => setSelectedAsset('NFTs')} className={`border border-slate-700 rounded-r-lg px-3 py-2 text-sm focus:outline-none transition-colors ${selectedAsset === 'NFTs' ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800/50"}`}>NFTs</button>
                </div>

                <input
                    type="text"
                    placeholder="Rechercher..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-slate-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="relative min-w-[180px]" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none flex items-center justify-between hover:bg-slate-700 transition-colors h-full"
                    >
                        <div className="flex items-center gap-2">
                            {activeNetwork.id !== 'Tous' && (
                                <NetworkAvatar name={activeNetwork.name} iconUrl={activeNetwork.icon} className="w-4 h-4 rounded-full" />
                            )}
                            <span className="truncate">{activeNetwork.name}</span>
                        </div>
                        <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
                            {networks.map(net => (
                                <button
                                    key={net.id}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
                                    onClick={() => { setSelectedNetworkId(net.id); setIsDropdownOpen(false); }}
                                >
                                    {net.id !== 'Tous' && (
                                        <NetworkAvatar name={net.name} iconUrl={net.icon} className="w-4 h-4 rounded-full" />
                                    )}
                                    <span className="truncate">{net.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* BLOC 1 : TOKENS (Séparé et préparé pour l'avenir) */}           
            {selectedAsset === 'Tokens' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-lg border-slate-700">
                        <p className="text-slate-400 text-xs font-bold">Actif</p>
                        <p className="text-slate-400 text-xs font-bold text-center">Cours</p>
                        <p className="text-slate-400 text-xs font-bold text-right">Valeur</p>
                    </div>

                    <div className="space-y-1">
                        {filteredAssets.length > 0 ? (
                            filteredAssets.map((asset, index) => (
                                <div key={`${asset.id}-${index}`} className="grid grid-cols-3 items-center p-3 bg-slate-800/30 rounded-lg border border-transparent hover:bg-slate-800/80 hover:border-slate-700 transition-all">
                                    {/* Colonne 1 : Pas d'overflow-hidden pour laisser respirer le badge entier */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            {asset.icon ? (
                                                <img src={asset.icon} className="w-8 h-8 rounded-full bg-slate-900 object-cover" alt={asset.symbol} />
                                            ) : (
                                                <img src="/globe.svg" className="w-8 h-8 rounded-full bg-slate-800 p-1 object-cover" alt="Unknown" />
                                            )}
                                            <NetworkAvatar name={asset.chainName} iconUrl={asset.chainIcon} className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 z-10 shadow-sm" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-white font-medium text-sm truncate">{asset.name}</p>
                                            <p className="text-slate-400 text-[10px] uppercase font-bold truncate">{asset.chainName}</p>
                                        </div>
                                    </div>

                                    {/* Colonne 2 : Cours (Strictement 2 décimales) */}
                                    <div className="text-center">
                                        <p className="text-slate-300 text-sm font-medium">
                                            ${asset.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </p>
                                    </div>

                                    {/* Colonne 3 : Valeur & Balance (Strictement 2 décimales) */}
                                    <div className="text-right">
                                        <p className="text-white font-bold text-sm">
                                            ${asset.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </p>
                                        <p className="text-slate-400 text-xs">
                                            {Number(asset.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {asset.symbol}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-4">Aucun actif trouvé.</p>
                        )}
                    </div>
                </div>
            )}

            {/* BLOC 2 : DEFI (Séparé et préparé pour l'avenir) */}
            {selectedAsset === 'DeFi' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-lg border-slate-700">
                        <p className="text-slate-400 text-xs font-bold">Protocole / Actif</p>
                        <p className="text-slate-400 text-xs font-bold text-center">Cours</p>
                        <p className="text-slate-400 text-xs font-bold text-right">Valeur</p>
                    </div>

                    <div className="space-y-1">
                        {filteredAssets.length > 0 ? (
                            filteredAssets.map((asset, index) => (
                                <div key={`${asset.id}-${index}`} className="grid grid-cols-3 items-center p-3 bg-slate-800/30 rounded-lg border border-transparent hover:bg-slate-800/80 hover:border-slate-700 transition-all">
                                    {/* Colonne 1 : Pas d'overflow-hidden pour laisser respirer le badge entier */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            {asset.icon ? (
                                                <img src={asset.icon} className="w-8 h-8 rounded-full bg-slate-900 object-cover" alt={asset.symbol} />
                                            ) : (
                                                <img src="/globe.svg" className="w-8 h-8 rounded-full bg-slate-800 p-1 object-cover" alt="Unknown" />
                                            )}
                                            <NetworkAvatar name={asset.chainName} iconUrl={asset.chainIcon} className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 z-10 shadow-sm" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-medium text-sm truncate">{asset.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-slate-400 text-[10px] uppercase font-bold truncate">{asset.chainName}</p>
                                                <span className="bg-blue-900/40 text-blue-300 text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border border-blue-800/50 whitespace-nowrap">
                                                    {asset.protocolName || asset.positionType.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Colonne 2 : Cours (Strictement 2 décimales) */}
                                    <div className="text-center">
                                        <p className="text-slate-300 text-sm font-medium">
                                            ${asset.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </p>
                                    </div>

                                    {/* Colonne 3 : Valeur & Balance (Strictement 2 décimales) */}
                                    <div className="text-right">
                                        <p className="text-white font-bold text-sm">
                                            ${asset.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </p>
                                        <p className="text-slate-400 text-xs">
                                            {Number(asset.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {asset.symbol}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-4">Aucune position DeFi trouvée.</p>
                        )}
                    </div>
                </div>
            )}

            {/* BLOC 3 : NFTs (Séparé et préparé pour l'avenir) */}
            {selectedAsset === 'NFTs' && <div></div>}
        </div>
    );
}