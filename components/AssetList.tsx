import React, { useState, useMemo } from 'react';

export default function AssetList({ assets }: { assets: any[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNetwork, setSelectedNetwork] = useState('Tous');

    const networks = useMemo(() => {
        const chains = assets.map(a => a.chain).filter((v, i, a) => a.indexOf(v) === i && v !== "unknown");
        return ['Tous', ...chains];
    }, [assets]);

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesNetwork = selectedNetwork === 'Tous' || asset.chain === selectedNetwork;
            return matchesSearch && matchesNetwork;
        });
    }, [assets, searchTerm, selectedNetwork]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <div>
                    <button className='bg-slate-800 text-white border border-slate-700 rounded-l-lg px-3 py-2 text-sm focus:outline-none'>Tokens</button>
                    <button className='bg-slate-800 text-white border-t border-b border-slate-700 px-3 py-2 text-sm focus:outline-none'>DeFi</button>
                    <button className='bg-slate-800 text-white border border-slate-700 rounded-r-lg px-3 py-2 text-sm focus:outline-none'>NFTs</button>
                </div>
                <input
                    type="text"
                    placeholder="Rechercher..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                >
                    {networks.map(net => (
                        <option key={net} value={net}>{net === 'Tous' ? 'Tous les réseaux' : net}</option>
                    ))}
                </select>
            </div>

            <div>
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-lg border-slate-700">
                    <p className="text-slate-400 text-xs font-bold">Actif</p>
                    <p className="text-slate-400 text-xs font-bold text-center">Cours</p>
                    <p className="text-slate-400 text-xs font-bold text-right">Valeur</p>
                </div>
            </div>

            <div className="space-y-1">
                {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset, index) => (
                        // ... dans le map des assets (à l'intérieur du JSX) ...
                        <div key={`${asset.id}-${index}`} className="grid grid-cols-3 items-center p-3 bg-slate-800/50 rounded-lg border-slate-700">

                            {/* Colonne 1 : Logo + Nom + Badge Réseau */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {asset.icon ? (
                                        <img src={asset.icon} className="w-8 h-8 rounded-full" alt={asset.symbol} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase">
                                            {asset.symbol?.substring(0, 1)}
                                        </div>
                                    )}
                                    {/* Petit badge réseau en bas à droite du logo */}
                                    {/* Logo du Réseau (Badge en bas à droite) */}
                                    <img
                                        src={`https://cdn.zerion.io/chains/${asset.chain}.png`}
                                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-slate-700 bg-slate-900 shadow-sm"
                                        alt={asset.chain}
                                        onError={(e) => {
                                            // Si le logo du réseau n'existe pas, on cache l'image pour ne pas avoir un carré vide
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>

                                <div>
                                    <p className="text-white font-medium text-sm truncate">{asset.name}</p>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold">{asset.chain}</p>
                                </div>
                            </div>

                            {/* Colonne 2 : Cours (Milieu) */}
                            <div className="text-center">
                                <p className="text-slate-300 text-sm font-medium">
                                    ${asset.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Colonne 3 : Valeur Totale + Balance (Droite) */}
                            <div className="text-right">
                                <p className="text-white font-bold text-sm">
                                    ${asset.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-slate-400 text-xs">{Number(asset.balance).toFixed(4)} {asset.symbol}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 text-center py-4">Aucun actif trouvé.</p>
                )}
            </div>
        </div>
    );
}