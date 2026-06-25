export type ChainKey = "plume" | "lisk" | "morph";

/**
 * positionType = ce que ton UI attend déjà (AssetList.tsx)
 * - wallet => onglet Tokens
 * - defi   => onglet DeFi
 * - nft    => onglet NFTs
 */
export type PositionType = "wallet" | "defi" | "nft";

/**
 * assetType = granularité métier interne
 */
export type AssetType =
  | "native"
  | "erc20"
  | "lp"
  | "lending_supply"
  | "lending_borrow"
  | "staking"
  | "vault"
  | "reward"
  | "nft";

export type Asset = {
  // identité
  id?: string;
  wallet: string;
  chain: ChainKey;
  chainId: number;
  chainName?: string;
  chainIcon?: string | null;
  icon?: string | null;

  // classification
  positionType: PositionType;
  assetType: AssetType;
  protocol?: string | null;

  // token/NFT
  contractAddress: string | null;
  tokenId?: string | null; // pour nft
  symbol: string;
  name: string;
  decimals: number;

  // montants
  rawBalance: string;        // bigint sérialisé
  formattedBalance: string;  // quantité human-readable
  quantity?: number;         // pratique pour UI existante
  priceUsd?: number | null;
  valueUsd?: number | null;

  // provenance
  source: "zerion" | "local-rpc";
  updatedAt: string;
};

export type FactoryErrorScope = "native" | "discovery" | "token" | "defi" | "merge";

export type FactoryError = {
  scope: FactoryErrorScope;
  chain?: ChainKey;
  reason: string;
  context?: string;
};

export type LocalFactoryResult = {
  native: Asset[];
  tokens: Asset[];
  defi: Asset[];
  partial: boolean;
  errors: FactoryError[];
  meta: {
    fromBlock: string;
    toBlock: string;
    discoveredContracts: number;
  };
};

export type CombinedAssetsResponse = {
  assets: Asset[];
  native: Asset[];
  tokens: Asset[];
  defi: Asset[];
  partial: boolean;
  errors: FactoryError[];
};