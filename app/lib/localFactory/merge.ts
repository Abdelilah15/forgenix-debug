import type { Asset, CombinedAssetsResponse, FactoryError } from "./types";

function dedupe(assets: Asset[]): Asset[] {
  const map = new Map<string, Asset>();
  for (const a of assets) {
    const key = [
      a.chainId,
      a.wallet.toLowerCase(),
      (a.contractAddress || "native").toLowerCase(),
      a.assetType,
      (a.protocol || "").toLowerCase(),
    ].join(":");

    const prev = map.get(key);
    if (!prev) {
      map.set(key, a);
      continue;
    }

    // priorité Zerion si conflit (tu peux inverser)
    if (prev.source !== "zerion" && a.source === "zerion") map.set(key, a);
  }
  return [...map.values()];
}

export function mergeAssets(params: {
  zerionAssets?: Asset[];
  localNative?: Asset[];
  localTokens?: Asset[];
  localDefi?: Asset[];
  errors?: FactoryError[];
  partial?: boolean;
}): CombinedAssetsResponse {
  const zerion = params.zerionAssets || [];
  const local = [...(params.localNative || []), ...(params.localTokens || []), ...(params.localDefi || [])];

  const all = dedupe([...zerion, ...local]);
  const native = all.filter((a) => a.assetType === "native");
  const defiTypes = new Set(["lp", "lending", "staking", "vault"]);
  const defi = all.filter((a) => defiTypes.has(a.assetType));
  const tokens = all.filter((a) => a.assetType === "erc20");

  return {
    assets: all,
    native,
    tokens,
    defi,
    partial: !!params.partial,
    errors: params.errors || [],
  };
}