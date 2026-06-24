import type { ChainKey } from "./types";

export type ChainConfig = {
  chain: ChainKey;
  chainId: number;
  rpcUrl: string;
  nativeSymbol: string;
  nativeName: string;
  nativeDecimals: number;
  maxBlockWindow: number;     // taille batch logs
  maxLookbackBlocks: number;  // scan initial
};

export const CHAINS: Record<ChainKey, ChainConfig> = {
  plume: {
    chain: "plume",
    chainId: 98866, // TODO: vérifier valeur réelle
    rpcUrl: process.env.PLUME_RPC_URL || "",
    nativeSymbol: "PLUME",
    nativeName: "Plume",
    nativeDecimals: 18,
    maxBlockWindow: 30_000,
    maxLookbackBlocks: 1_200_000,
  },
  lisk: {
    chain: "lisk",
    chainId: 1135, // TODO: vérifier valeur réelle
    rpcUrl: process.env.LISK_RPC_URL || "",
    nativeSymbol: "ETH",
    nativeName: "Lisk Native",
    nativeDecimals: 18,
    maxBlockWindow: 40_000,
    maxLookbackBlocks: 1_200_000,
  },
  morph: {
    chain: "morph",
    chainId: 2818, // TODO: vérifier valeur réelle
    rpcUrl: process.env.MORPH_RPC_URL || "",
    nativeSymbol: "ETH",
    nativeName: "Morph Native",
    nativeDecimals: 18,
    maxBlockWindow: 40_000,
    maxLookbackBlocks: 1_200_000,
  },
};

export function getEnabledChains(input?: string): ChainKey[] {
  if (!input) return ["plume", "lisk", "morph"];
  return input
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ChainKey => s === "plume" || s === "lisk" || s === "morph");
}