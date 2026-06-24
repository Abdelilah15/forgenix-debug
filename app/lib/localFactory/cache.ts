import type { ChainKey } from "./types";

// Interface cache simple (tu pourras remplacer par Redis/DB)
export type WalletScanCursor = {
  lastScannedBlock: string; // bigint serialized
  updatedAt: string;
};

export type WalletTokenSeen = {
  contracts: string[]; // checksum addresses
  updatedAt: string;
};

const cursorStore = new Map<string, WalletScanCursor>();
const seenStore = new Map<string, WalletTokenSeen>();

function key(chain: ChainKey, wallet: string) {
  return `${chain}:${wallet.toLowerCase()}`;
}

export async function getCursor(chain: ChainKey, wallet: string): Promise<bigint | null> {
  const v = cursorStore.get(key(chain, wallet));
  if (!v) return null;
  try {
    return BigInt(v.lastScannedBlock);
  } catch {
    return null;
  }
}

export async function setCursor(chain: ChainKey, wallet: string, block: bigint): Promise<void> {
  cursorStore.set(key(chain, wallet), {
    lastScannedBlock: block.toString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function getSeenContracts(chain: ChainKey, wallet: string): Promise<Set<string>> {
  const v = seenStore.get(key(chain, wallet));
  return new Set((v?.contracts || []).map((c) => c.toLowerCase()));
}

export async function addSeenContracts(chain: ChainKey, wallet: string, contracts: string[]): Promise<void> {
  const k = key(chain, wallet);
  const existing = new Set((seenStore.get(k)?.contracts || []).map((c) => c.toLowerCase()));
  for (const c of contracts) existing.add(c.toLowerCase());
  seenStore.set(k, {
    contracts: [...existing],
    updatedAt: new Date().toISOString(),
  });
}