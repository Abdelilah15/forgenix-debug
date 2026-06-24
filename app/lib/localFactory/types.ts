export type ChainKey = "plume" | "lisk" | "morph";

export type AssetType = "native" | "erc20" | "lp" | "lending" | "staking" | "vault";

export type Asset = {
  chain: ChainKey;
  chainId: number;
  wallet: string;
  assetType: AssetType;
  protocol?: string;
  contractAddress: string | null;
  symbol: string;
  name: string;
  decimals: number;
  rawBalance: string;        // bigint serialized
  formattedBalance: string;  // human-readable
  priceUsd?: number | null;
  valueUsd?: number | null;
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
    fromBlock: string; // bigint -> string
    toBlock: string;   // bigint -> string
    discoveredContracts: number;
  };
};

export type CombinedAssetsResponse = {
  assets: Asset[];      // flat list pour compatibilité UI globale
  native: Asset[];
  tokens: Asset[];
  defi: Asset[];
  partial: boolean;
  errors: FactoryError[];
};