import { JsonRpcProvider, Contract, id, zeroPadValue, getAddress } from "ethers";
import type { Asset, LocalFactoryResult, FactoryError } from "./types";
import type { ChainConfig } from "./chains";
import { getCursor, setCursor, getSeenContracts, addSeenContracts } from "./cache";

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

    return {
        chain: cfg.chain,
        chainId: cfg.chainId,
        wallet,
        assetType: "native",
        contractAddress: null,
        symbol: cfg.nativeSymbol,
        name: cfg.nativeName,
        decimals: cfg.nativeDecimals,
        rawBalance: r.toString(),
        formattedBalance: formatUnitsSafe(r, cfg.nativeDecimals),
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

    return {
        chain: cfg.chain,
        chainId: cfg.chainId,
        wallet,
        assetType: "erc20",
        contractAddress: token,
        symbol,
        name,
        decimals: d,
        rawBalance: raw.toString(),
        formattedBalance: formatUnitsSafe(raw, d),
        source: "local-rpc",
        updatedAt: new Date().toISOString(),
    };
}

async function fetchDefiAdapters(_provider: JsonRpcProvider, _cfg: ChainConfig, _wallet: string): Promise<Asset[]> {
    // brancher tes adapters DeFi ici
    return [];
}

export async function runLocalFactory(wallet: string, cfg: ChainConfig): Promise<LocalFactoryResult> {
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
        defi = await fetchDefiAdapters(provider, cfg, wallet);
    } catch (e: any) {
        partial = true;
        errors.push({ scope: "defi", chain: cfg.chain, reason: e?.message || "defi failed" });
    }

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