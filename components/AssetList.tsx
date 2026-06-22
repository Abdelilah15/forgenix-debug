import React from 'react';

export default function AssetList({ assets }: { assets: any[] }) {
  if (!assets.length) return <p className="text-slate-500 text-sm">Aucun actif trouvé.</p>;

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            {asset.icon && <img src={asset.icon} className="w-8 h-8 rounded-full" alt={asset.symbol} />}
            <div>
              <p className="text-white font-medium text-sm">{asset.name}</p>
              <p className="text-slate-400 text-xs">{asset.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-sm">${asset.value?.toFixed(2)}</p>
            <p className="text-slate-400 text-xs">{asset.balance} {asset.symbol}</p>
          </div>
        </div>
      ))}
    </div>
  );
}