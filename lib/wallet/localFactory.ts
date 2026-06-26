import { JsonRpcProvider, Contract, id, zeroPadValue, getAddress } from "ethers";
import type { Asset, LocalFactoryResult, FactoryError } from "./types";
import type { ChainConfig } from "./chains";
import { getCursor, setCursor, getSeenContracts, addSeenContracts } from "./cache";



const CHAIN_ICONS_MAP: Record<string, { chain: string; token: string }> = {
  plume: {
    chain: "https://cdn.prod.website-files.com/670fc97cba6a0b3f2e579538/67caae7d641e95b46d3f6d2c_plume-token.svg",
    token: "https://cdn.prod.website-files.com/670fc97cba6a0b3f2e579538/67caae7d641e95b46d3f6d2c_plume-token.svg"
  },
  lisk: {
    chain: "https://cryptocurrencyjobs.co/startups/assets/logos/lisk.baa502c183d879321ba54a9afa28077cbf702bcd1fa43187db11af9e7c1af74e_hu_3591cd61297c4e4e.png",
    token: "https://static.cdnlogo.com/logos/e/81/ethereum-eth.svg"
  },
  morph: {
    chain: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqF2UAgt6OlrU0S_t_pgeBmJ1ykq4p97jBm0iZI6QDFg&s",
    token: "https://static.cdnlogo.com/logos/e/81/ethereum-eth.svg"
  }
};

// Dictionnaire pour la valorisation CoinGecko (Prix USD)
const PRICING_MAP: Record<string, { platform: string | null; nativeId: string }> = {
  lisk: { platform: "lisk", nativeId: "ethereum" },
  morph: { platform: "morph", nativeId: "ethereum" }, 
  plume: { platform: "plume-network", nativeId: "plume" }
};

// Liste de jetons prioritaires à vérifier systématiquement par réseau
const COMMON_TOKENS: Record<string, string[]> = {
  plume: [
    "0xba22119ec0310237599052062534f9640822f3e9", // pUSD
    "0x1c4484307567820120272f3e9365315843472091", // goBTC
    "0x55d398326f99059ff775485246999027b3197955", // USDT
  ],
  lisk: [
    "0x05D032ac25d002E9923E9f8a3c4d570562145592", // LSK
    "0x4200000000000000000000000000000000000006", // WETH
  ],
  morph: [
    "0x53035C95f1993c90568937497d8d0912df8039b5", // WETH
    "0x9999999999999999999999999999999999999999", // Placeholder
  ]
};

// ABI enrichie pour détecter les différents standards DeFi
const DEFI_DETECTION_ABI = [
  // Basiques
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  
  // ERC4626 (Vaults)
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function convertToAssets(uint256) view returns (uint256)",
  
  // Lending/Borrowing (Compound, Aave)
  "function underlying() view returns (address)",
  "function exchangeRateStored() view returns (uint256)",
  "function borrowBalanceStored(address) view returns (uint256)",
  
  // Staking
  "function stakedBalance(address) view returns (uint256)",
  "function locked(address) view returns (tuple(uint256 amount, uint256 end))",
  "function balanceOfAt(address, uint256) view returns (uint256)",
  
  // Liquidity Pools (Uniswap V2, Curve)
  "function getReserves() view returns (uint112, uint112, uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
  
  // Governance (veTokens)
  "function locked__end(address) view returns (uint256)",
  "function locked__amount(address) view returns (uint256)",
  "function voting_escrow() view returns (address)"
];

// Fonction de détection du type d'actif DeFi basée sur les fonctions disponibles
async function detectDefiType(contract: Contract, contractAddress: string, provider: JsonRpcProvider): Promise<string> {
  try {
    // Vérifier les signatures spécifiques pour chaque type
    const checks = await Promise.allSettled([
      contract.getReserves?.().then(() => "lp").catch(() => null),           // Liquidity Pool
      contract.locked?.(contractAddress).then(() => "staking").catch(() => null), // Staking (veToken style)
      contract.stakedBalance?.(contractAddress).then(() => "staking").catch(() => null), // Staking
      contract.borrowBalanceStored?.(contractAddress).then(() => "lending_borrow").catch(() => null), // Borrowing
      contract.exchangeRateStored?.().then(() => "lending_supply").catch(() => null), // Lending (cToken style)
      contract.asset?.().then(() => "vault").catch(() => null),              // ERC4626 Vault
      contract.underlying?.().then(() => "lending_supply").catch(() => null), // Lending
    ]);

    for (const check of checks) {
      if (check.status === "fulfilled" && check.value) {
        return check.value;
      }
    }

    // Fallback: vault générique
    return "vault";
  } catch (err) {
    return "vault";
  }
}

async function fetchDefiAdapters(
  provider: JsonRpcProvider,
  cfg: ChainConfig,
  wallet: string,
  discoveredContracts: string[]
): Promise<Asset[]> {
  const defiAssets: Asset[] = [];
  const icons = CHAIN_ICONS_MAP[cfg.chain.toLowerCase()] || { chain: null, token: null };

  const contractsToTest = discoveredContracts.filter(c => c !== "native");

  for (const contractAddress of contractsToTest) {
    try {
      const contract = new Contract(contractAddress, DEFI_DETECTION_ABI, provider);

      // 1. Vérification du solde dans le contrat DeFi
      const bal = await contract.balanceOf(wallet).catch(() => null);
      if (!bal) continue;

      const rawBalance = BigInt(bal.toString());
      if (rawBalance <= BI_ZERO) continue;

      // 2. Récupération des détails du contrat de rendement / yield principal
      const [protoSymbol, protoName, decimals] = await Promise.all([
        contract.symbol().catch(() => "DeFi"),
        contract.name().catch(() => "Yield Position"),
        contract.decimals().catch(() => 18)
      ]);

      // 3. Détection du type DeFi spécifique
      const defiType = await detectDefiType(contract, contractAddress, provider);

      // 4. Détection dynamique de l'underlying (ERC4626 ou Lending)
      let underlyingAddress: string | null = null;
      underlyingAddress = await contract.asset().catch(() => null);
      if (!underlyingAddress) {
        underlyingAddress = await contract.underlying().catch(() => null);
      }

      let tSymbol = "???";
      let underlyingDecimals = 18;

      // Si un jeton sous-jacent est présent et qu'il ne s'agit pas de l'adresse native/zéro
      if (underlyingAddress && underlyingAddress !== "0x0000000000000000000000000000000000000000") {
        const tokenContract = new Contract(underlyingAddress, ERC20_ABI, provider);
        const [fetchedSymbol, fetchedDecimals] = await Promise.all([
          tokenContract.symbol().catch(() => "???"),
          tokenContract.decimals().catch(() => 18)
        ]);
        tSymbol = fetchedSymbol;
        underlyingDecimals = Number(fetchedDecimals);
      } else {
        // Fallback si pas de sous-jacent : on traite le jeton de rendement lui-même
        tSymbol = protoSymbol;
        underlyingAddress = contractAddress;
      }

      const d = Number(decimals);
      const formatted = formatUnitsSafe(rawBalance, d);

      defiAssets.push({
        id: `${contractAddress}-defi-${wallet}`,
        wallet: wallet,
        chain: cfg.chain,
        chainId: cfg.chainId,
        chainName: cfg.nativeName,
        chainIcon: icons.chain,
        icon: icons.token,
        positionType: "defi",
        assetType: defiType as any,  // Utiliser le type détecté au lieu de "vault"
        protocol: protoName,
        contractAddress: underlyingAddress, 
        symbol: protoSymbol,
        name: underlyingAddress === contractAddress ? protoName : `${protoName} (${tSymbol})`,
        decimals: d,
        rawBalance: rawBalance.toString(),
        formattedBalance: formatted,
        quantity: Number(formatted),
        priceUsd: 0,
        valueUsd: 0,
        source: "local-rpc",
        updatedAt: new Date().toISOString()
      });

    } catch (err) {
      continue;
    }
  }

  return defiAssets;
}


const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

const BI_ZERO = BigInt(0);
const BI_ONE = BigInt(1);

function formatUnitsSafe(raw: bigint, decimals: number): string {
  const d = Math.max(0, decimals);
  const s = raw.toString().padStart(d + 1, "0");
  const int = s.slice(0, -d) || "0";
  const frac = s.slice(-d).replace(/0+$/, "");
  return frac ? `${int}.${frac}` : int;
}

async function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms));
  return Promise.race([p, timeout]);
}

async function retry<T>(fn: () => Promise<T>, retries = 2, baseDelay = 250): Promise<T> {
  let err: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      if (i < retries) await new Promise((r) => setTimeout(r, baseDelay * 2 ** i));
    }
  }
  throw err;
}

async function discoverContractsByTransferLogs(
  provider: JsonRpcProvider,
  wallet: string,
  fromBlock: bigint,
  toBlock: bigint,
  windowSize: number
): Promise<Set<string>> {
  const TRANSFER_TOPIC = id("Transfer(address,address,uint256)");
  const walletTopic = zeroPadValue(wallet, 32).toLowerCase();

  const found = new Set<string>();
  const step = BigInt(windowSize);

  let start = fromBlock;
  while (start <= toBlock) {
    const tentativeEnd = start + step - BI_ONE;
    const end = tentativeEnd > toBlock ? toBlock : tentativeEnd;

    const [inbound, outbound] = await Promise.allSettled([
      retry(() =>
        withTimeout(
          provider.getLogs({ fromBlock: start, toBlock: end, topics: [TRANSFER_TOPIC, null, walletTopic] }),
          12000,
          "inbound logs timeout"
        )
      ),
      retry(() =>
        withTimeout(
          provider.getLogs({ fromBlock: start, toBlock: end, topics: [TRANSFER_TOPIC, walletTopic, null] }),
          12000,
          "outbound logs timeout"
        )
      ),
    ]);

    if (inbound.status === "fulfilled") {
      for (const l of inbound.value) found.add(getAddress(l.address));
    }
    if (outbound.status === "fulfilled") {
      for (const l of outbound.value) found.add(getAddress(l.address));
    }

    start = end + BI_ONE;
  }

  return found;
}

async function fetchNative(provider: JsonRpcProvider, cfg: ChainConfig, wallet: string): Promise<Asset> {
  const raw = await retry(() => withTimeout(provider.getBalance(wallet), 7000, "native timeout"));
  const r = BigInt(raw.toString());
  const icons = CHAIN_ICONS_MAP[cfg.chain.toLowerCase()] || { chain: null, token: null };

  return {
    chain: cfg.chain,
    chainId: cfg.chainId,
    wallet,
    positionType: "wallet",
    assetType: "native",
    contractAddress: "native",
    symbol: cfg.nativeSymbol,
    name: cfg.nativeName,
    decimals: cfg.nativeDecimals,
    rawBalance: r.toString(),
    formattedBalance: formatUnitsSafe(r, cfg.nativeDecimals),
    quantity: Number(formatUnitsSafe(r, cfg.nativeDecimals)),
    chainIcon: icons.chain,
    icon: icons.token,
    source: "local-rpc",
    updatedAt: new Date().toISOString(),
  };
}

async function fetchToken(provider: JsonRpcProvider, cfg: ChainConfig, wallet: string, token: string): Promise<Asset | null> {
  const c = new Contract(token, ERC20_ABI, provider);
  const bal = await retry(() => withTimeout(c.balanceOf(wallet), 7000, "balanceOf timeout")).catch(() => null);
  if (bal == null) return null;

  const raw = BigInt(bal.toString());
  if (raw <= BI_ZERO) return null;

  const [symbol, name, decimals] = await Promise.all([
    retry(() => withTimeout(c.symbol(), 5000, "symbol timeout")).catch(() => "UNKNOWN"),
    retry(() => withTimeout(c.name(), 5000, "name timeout")).catch(() => "Unknown Token"),
    retry(() => withTimeout(c.decimals(), 5000, "decimals timeout")).catch(() => 18),
  ]);

  const d = Number(decimals);
  const formatted = formatUnitsSafe(raw, d);
  const icons = CHAIN_ICONS_MAP[cfg.chain.toLowerCase()] || { chain: null, token: null };
  const isDefi = /staked|stake|vault|pool|yield|earn|receipt/i.test(name) || /^st[A-Z]/i.test(symbol);

  return {
    chain: cfg.chain,
    chainId: cfg.chainId,
    wallet,
    positionType: isDefi ? "defi" : "wallet", 
    assetType: isDefi ? "vault" : "erc20",
    contractAddress: token,
    symbol,
    name,
    decimals: d,
    rawBalance: raw.toString(),
    formattedBalance: formatted,
    quantity: Number(formatted),
    chainIcon: icons.chain,
    icon: icons.token,
    source: "local-rpc",
    updatedAt: new Date().toISOString(),
  };
}


export async function runLocalFactory(wallet: string, cfg: ChainConfig): Promise<LocalFactoryResult> {

  async function enrichWithPrices(chainKey: string, nativeAssets: Asset[], tokenAssets: Asset[]): Promise<void> {
    const config = PRICING_MAP[chainKey.toLowerCase()];
    if (!config) return;

    const delay = chainKey === 'plume' ? 0 : chainKey === 'lisk' ? 1000 : 2000;
    await new Promise(r => setTimeout(r, delay));

    try {
      // 1. Prix de l'actif Natif (Le jeton de Gas : ETH ou LSK)
      let nativePrice = 0;
      if (nativeAssets.length > 0) {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${config.nativeId}&vs_currencies=usd`);
        if (res.ok) {
          const data = await res.json();
          nativePrice = data[config.nativeId]?.usd || 0;
          nativeAssets[0].priceUsd = nativePrice;
          nativeAssets[0].valueUsd = parseFloat(((nativeAssets[0].quantity || 0) * nativePrice).toFixed(2));
        }
      }

      // 2. Prix des jetons ERC20 via CoinGecko
      const priceMap: Record<string, number> = {};
      if (config.platform) {
        const addresses = tokenAssets.map(t => t.contractAddress).filter(Boolean).join(',');
        if (addresses) {
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/${config.platform}?contract_addresses=${addresses}&vs_currencies=usd`);
          if (res.ok) {
            const data = await res.json();
            for (const token of tokenAssets) {
              if (token.contractAddress) {
                const tokenData = data[token.contractAddress.toLowerCase()];
                if (tokenData && tokenData.usd) {
                  priceMap[token.contractAddress.toLowerCase()] = tokenData.usd;
                  token.priceUsd = tokenData.usd;
                  token.valueUsd = parseFloat(((token.quantity || 0) * tokenData.usd).toFixed(2));
                }
              }
            }
          }
        }
      }

      // 3. Calcul des prix pour les actifs DeFi complexes (LP, Vaults)
      for (const asset of tokenAssets) {
        if (asset.positionType !== "defi" || (asset.priceUsd && asset.priceUsd > 0)) continue;

        try {
          const contract = new Contract(asset.id?.split('-')[0] || "", DEFI_DETECTION_ABI, provider);
          
          if (asset.assetType === "lp") {
            // Calcul LP (Uniswap V2 style)
            const [reserves, totalSupply, t0, t1] = await Promise.all([
              contract.getReserves(),
              contract.totalSupply(),
              contract.token0(),
              contract.token1()
            ]);
            
            // On essaie de récupérer les prix des deux jetons
            const [p0, p1] = [priceMap[t0.toLowerCase()] || 0, priceMap[t1.toLowerCase()] || 0];
            
            if (p0 > 0 || p1 > 0) {
              // Si on a au moins un prix, on peut estimer la valeur totale de la pool
              // (En supposant que la pool est équilibrée 50/50 en valeur)
              const totalValue = p0 > 0 ? (Number(reserves[0]) / 1e18) * p0 * 2 : (Number(reserves[1]) / 1e18) * p1 * 2;
              asset.priceUsd = totalValue / (Number(totalSupply) / 1e18);
              asset.valueUsd = parseFloat(((asset.quantity || 0) * asset.priceUsd).toFixed(2));
            }
          } else if (asset.assetType === "vault" || asset.assetType === "lending_supply") {
            // Calcul Vault/Lending (ERC4626 ou cToken)
            // On récupère le prix de l'underlying
            const underlyingPrice = priceMap[asset.contractAddress?.toLowerCase() || ""] || 0;
            if (underlyingPrice > 0) {
              const ratio = await contract.convertToAssets?.(BI_ONE).catch(() => 
                            contract.exchangeRateStored?.().catch(() => BI_ONE));
              
              const multiplier = Number(ratio) / (10 ** asset.decimals);
              asset.priceUsd = underlyingPrice * multiplier;
              asset.valueUsd = parseFloat(((asset.quantity || 0) * asset.priceUsd).toFixed(2));
            }
          }
        } catch (err) {
          // Fail-safe pour un actif spécifique
        }
      }
    } catch (error) {
      console.warn(`⚠️ Impossible de récupérer les prix pour ${chainKey}`);
    }
  }

  const provider = new JsonRpcProvider(cfg.rpcUrl);
  const errors: FactoryError[] = [];
  let partial = false;

  const latest = BigInt(await retry(() => withTimeout(provider.getBlockNumber(), 7000, "blockNumber timeout")));
  const cursor = await getCursor(cfg.chain, wallet);

  const lookback = BigInt(cfg.maxLookbackBlocks);
  const fallbackFrom = latest > lookback ? latest - lookback : BI_ZERO;
  const fromBlock = cursor != null ? cursor + BI_ONE : fallbackFrom;
  const toBlock = latest;

  let native: Asset[] = [];
  try {
    native = [await fetchNative(provider, cfg, wallet)];
  } catch (e: any) {
    partial = true;
    errors.push({ scope: "native", chain: cfg.chain, reason: e?.message || "native failed" });
  }

  let discovered = new Set<string>();
  try {
    discovered = await discoverContractsByTransferLogs(provider, wallet, fromBlock, toBlock, cfg.maxBlockWindow);
  } catch (e: any) {
    partial = true;
    errors.push({ scope: "discovery", chain: cfg.chain, reason: e?.message || "discovery failed" });
  }

  const seen = await getSeenContracts(cfg.chain, wallet);
  for (const c of discovered) seen.add(c.toLowerCase());

  // Ajouter les jetons communs à la liste de vérification
  const common = COMMON_TOKENS[cfg.chain.toLowerCase()] || [];
  for (const c of common) seen.add(c.toLowerCase());

  const tokens: Asset[] = [];
  const allContracts = [...seen];
  for (let i = 0; i < allContracts.length; i += 40) {
    const chunk = allContracts.slice(i, i + 40);
    const settled = await Promise.allSettled(chunk.map((c) => fetchToken(provider, cfg, wallet, c)));
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value) tokens.push(s.value);
      if (s.status === "rejected") {
        partial = true;
        errors.push({ scope: "token", chain: cfg.chain, reason: s.reason?.message || "token read failed" });
      }
    }
  }

  let defi: Asset[] = [];
  try {
    defi = await fetchDefiAdapters(provider, cfg, wallet, allContracts);
  } catch (e: any) {
    partial = true;
    errors.push({ scope: "defi", chain: cfg.chain, reason: e?.message || "defi failed" });
  }

  await enrichWithPrices(cfg.chain, native, [...tokens, ...defi]);
  await addSeenContracts(cfg.chain, wallet, [...discovered]);
  await setCursor(cfg.chain, wallet, toBlock);

  return {
    native,
    tokens,
    defi,
    partial,
    errors,
    meta: {
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      discoveredContracts: discovered.size,
    },
  };
}
