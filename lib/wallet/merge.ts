import type { Asset, CombinedAssetsResponse, FactoryError } from "./types";

function safeNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function enrichForUI(a: Asset): Asset {
  const qty =
    a.quantity != null
      ? safeNumber(a.quantity, 0)
      : safeNumber(a.formattedBalance, 0);

  const value =
    a.valueUsd != null
      ? safeNumber(a.valueUsd, 0)
      : a.priceUsd != null
      ? qty * safeNumber(a.priceUsd, 0)
      : 0;

  return {
    ...a,
    quantity: qty,
    valueUsd: value,
    chainName: a.chainName ?? a.chain,
    chainIcon: a.chainIcon ?? null,
  };
}

function dedupe(assets: Asset[]): Asset[] {
  const map = new Map<string, Asset>();

  for (const raw of assets) {
    const a = enrichForUI(raw);

    // clé de déduplication
    const key = [
      String(a.chainId),
      a.wallet.toLowerCase(),
      (a.contractAddress || "native").toLowerCase(),
      a.assetType,
      (a.protocol || "").toLowerCase(),
      (a.tokenId || "").toLowerCase(),
    ].join(":");

    const prev = map.get(key);
    if (!prev) {
      map.set(key, a);
      continue;
    }

    // priorité à la source zerion, sinon plus grande valueUsd
    if (prev.source !== "zerion" && a.source === "zerion") {
      map.set(key, a);
      continue;
    }

    if ((a.valueUsd || 0) > (prev.valueUsd || 0)) {
      map.set(key, a);
    }
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
  const local = [
    ...(params.localNative || []),
    ...(params.localTokens || []),
    ...(params.localDefi || []),
  ];

  const all = dedupe([...zerion, ...local]);
  all.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

  const native = all.filter((a) => a.assetType === "native");
  const tokens = all.filter((a) => a.positionType === "wallet"); // <- onglet Tokens
  const defi = all.filter((a) => a.positionType === "defi");     // <- onglet DeFi

  return {
    assets: all,
    native,
    tokens,
    defi,
    partial: !!params.partial,
    errors: params.errors || [],
  };
}