"use client";

import { useState, useEffect } from "react";
import { Asset } from "@/lib/wallet/types"; // Ajuste le chemin selon ton projet

// Mapping entre tes clés de réseaux locales et les IDs officiels de CoinGecko
const COINGECKO_PLATFORMS: Record<string, string> = {
  lisk: "lisk",
  eth: "ethereum",
  // Note: Plume et Morph sont très récents, ils n'ont peut-être pas encore
  // d'ID "asset_platform" sur CoinGecko.
};

export default function TokenIcon({ asset }: { asset: Asset }) {
  const [iconUrl, setIconUrl] = useState<string | null>(asset.icon || null);
  const [isLoading, setIsLoading] = useState(!asset.icon && asset.contractAddress && asset.contractAddress !== "native");

  useEffect(() => {
    // Si on a déjà l'icône (ex: via Zerion) ou si c'est un token natif (géré localement), on ignore
    if (asset.icon || asset.contractAddress === "native" || !asset.contractAddress) {
      setIsLoading(false);
      return;
    }

    const fetchCoinGeckoIcon = async () => {
      try {
        const platform = COINGECKO_PLATFORMS[asset.chain.toLowerCase()];
        if (!platform) {
          setIsLoading(false);
          return; // Réseau non supporté par CoinGecko pour le moment
        }

        // Appel à l'API publique CoinGecko pour récupérer les infos du contrat
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${platform}/contract/${asset.contractAddress}`);
        if (!res.ok) throw new Error("Non trouvé");

        const data = await res.json();
        if (data.image?.small) {
          setIconUrl(data.image.small);
        }
      } catch (error) {
        // Échec silencieux, on gardera le fallback (l'icône par défaut)
        console.warn(`Icône introuvable pour ${asset.symbol}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Un petit délai (debounce) de 300ms pour éviter de spammer CoinGecko au défilement
    const timer = setTimeout(() => {
      fetchCoinGeckoIcon();
    }, 300);

    return () => clearTimeout(timer);
  }, [asset]);

  if (isLoading) {
    // Skeleton loader stylisé avec Tailwind
    return <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />;
  }

  return (
    <img
      src={iconUrl || "/globe.svg"} // Fallback : une icône générique ou ton logo de base
      alt={asset.symbol}
      className="w-8 h-8 rounded-full object-cover"
      onError={(e) => {
        // Sécurité supplémentaire si l'URL renvoyée est cassée
        (e.target as HTMLImageElement).src = "/globe.svg"; 
      }}
    />
  );
}