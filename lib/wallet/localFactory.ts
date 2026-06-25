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
  morph: { platform: null, nativeId: "ethereum" }, // "null" car CoinGecko n'a pas encore de plateforme officielle pour les ERC20 de Morph
  plume: { platform: null, nativeId: "plume" }  // Idem pour Plume
};

// Supprime le dictionnaire DEFI_PROTOCOLS_CONFIG ! 
// On définit juste une liste d'ABIs enrichie pour détecter les standards de Staking/Vaults
const DEFI_DETECTION_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function asset() view returns (address)",       // Standard ERC4626 (Vaults)
  "function underlying() view returns (address)",  // Standard Lending (Compound/Aave)
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

async function fetchDefiAdapters(
  provider: JsonRpcProvider,
  cfg: ChainConfig,
  wallet: string,
  discoveredContracts: string[] // ✅ On lui passe tous les contrats découverts par les logs !
): Promise<Asset[]> {
  const defiAssets: Asset[] = [];
  const icons = CHAIN_ICONS_MAP[cfg.chain.toLowerCase()] || { chain: null, token: null };

  // On filtre pour éviter de scanner l'adresse native
  const contractsToTest = discoveredContracts.filter(c => c !== "native");

  for (const contractAddress of contractsToTest) {
    try {
      const contract = new Contract(contractAddress, DEFI_DETECTION_ABI, provider);

      // 1. Est-ce que le wallet connecté a un solde dans ce contrat ?
      const bal = await contract.balanceOf(wallet).catch(() => null);
      if (!bal) continue;

      const rawBalance = BigInt(bal.toString());
      if (rawBalance <= BI_ZERO) continue;

      // 2. Détection dynamique : Est-ce un contrat DeFi (Vault/Staking/Lending) ?
      // On cherche à savoir s'il y a un jeton sous-jacent (underlying asset)
      let underlyingAddress: string | null = null;

      // Test du standard ERC4626 (.asset())
      underlyingAddress = await contract.asset().catch(() => null);
      // Test du standard Lending (.underlying()) si le premier a échoué
      if (!underlyingAddress) {
        underlyingAddress = await contract.underlying().catch(() => null);
      }

      // Si le contrat ne renvoie aucun sous-jacent, ce n'est probablement qu'un simple token ERC20 de portefeuille, pas une position DeFi. On passe au suivant !
      if (!underlyingAddress) continue;

      // 3. Récupération du nom du protocole/Yield token
      const [protoSymbol, protoName] = await Promise.all([
        contract.symbol().catch(() => "DeFi"),
        contract.name().catch(() => "Yield Position")
      ]);

      // 4. Lecture des métadonnées du jeton sous-jacent staké
      const tokenContract = new Contract(underlyingAddress, ERC20_ABI, provider);
      const [tSymbol, tDecimals] = await Promise.all([
        tokenContract.symbol().catch(() => "???"),
        tokenContract.decimals().catch(() => 18)
      ]);

      const decimals = Number(tDecimals);
      const formatted = formatUnitsSafe(rawBalance, decimals);

      defiAssets.push({
        id: `${contractAddress}-defi-${wallet}`,
        wallet: wallet,
        chain: cfg.chain,
        chainId: cfg.chainId,
        chainName: cfg.name,
        chainIcon: icons.chain,
        icon: icons.token,
        positionType: "defi", // Rangement direct dans l'onglet DeFi
        assetType: "vault",
        protocol: protoName,   // Ex: "Plume Liquid Staking"
        contractAddress: underlyingAddress, // L'adresse du sous-jacent pour CoinGecko (prix)
        symbol: protoSymbol,  // Ex: "stPLUME"
        name: `${protoName} (${tSymbol})`,
        decimals: decimals,
        rawBalance: rawBalance.toString(),
        formattedBalance: formatted,
        quantity: Number(formatted),
        priceUsd: 0,
        valueUsd: 0,
        source: "local-rpc",
        updatedAt: new Date().toISOString()
      });

    } catch (err) {
      // Échec silencieux pour cette adresse, on continue le scan des autres
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

  return {
    chain: cfg.chain,
    chainId: cfg.chainId,
    wallet,
    positionType: "wallet",
    assetType: "erc20",
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

    try {
      // 1. Prix de l'actif Natif (Le jeton de Gas : ETH ou LSK)
      if (nativeAssets.length > 0) {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${config.nativeId}&vs_currencies=usd`);
        if (res.ok) {
          const data = await res.json();
          const price = data[config.nativeId]?.usd || 0;
          nativeAssets[0].priceUsd = price;
          nativeAssets[0].valueUsd = parseFloat(((nativeAssets[0].quantity || 0) * price).toFixed(2));
        }
      }

      // 2. Prix des jetons ERC20 (Seulement si le réseau est supporté par CoinGecko)
      if (tokenAssets.length > 0 && config.platform) {
        // ✅ BATCHING : On regroupe toutes les adresses séparées par des virgules (1 seule requête API !)
        const addresses = tokenAssets.map(t => t.contractAddress).filter(Boolean).join(',');

        if (addresses) {
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/${config.platform}?contract_addresses=${addresses}&vs_currencies=usd`);
          if (res.ok) {
            const data = await res.json();
            // On distribue les prix reçus dans nos assets
            for (const token of tokenAssets) {
              if (token.contractAddress) {
                const tokenData = data[token.contractAddress.toLowerCase()]; // CoinGecko renvoie les clés en minuscules
                if (tokenData && tokenData.usd) {
                  token.priceUsd = tokenData.usd;
                  token.valueUsd = parseFloat(((token.quantity || 0) * tokenData.usd).toFixed(2));
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Fail-safe silencieux : si CoinGecko bloque (Rate Limit), l'application continue sans crasher
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

  await enrichWithPrices(cfg.chain, native, tokens);
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