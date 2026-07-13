'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPublicClient, http, parseAbi, parseAbiItem, hexToString, type Log } from 'viem';
import { baseSepolia } from 'viem/chains';
import { FACTORY_ADDRESS } from '@/app/lib/contracts'; // Ajustez le chemin

// --- EVENT: doit correspondre EXACTEMENT à IFactory.sol ---
// event ProxyDeployed(
//   address indexed cloneAddress,
//   address indexed implementation,
//   bytes32 indexed contractType,   <-- bytes32, PAS string
//   address deployer,               <-- PAS indexed
//   bool isWhiteLabeled             <-- PAS indexed
// );
// Le topic0 (l'id de l'event dans les logs) dépend uniquement des TYPES ci-dessus.
// Toute divergence de type (ex: string au lieu de bytes32) donne un topic0 différent
// => getLogs ne retrouvera jamais aucun log, sans lever d'erreur.
const PROXY_DEPLOYED_EVENT = parseAbiItem(
  'event ProxyDeployed(address indexed cloneAddress, address indexed implementation, bytes32 indexed contractType, address deployer, bool isWhiteLabeled)'
);

// ABI de lecture pour récupérer les infos des contrats déployés
const CONTRACT_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function contractURI() view returns (string)',
  'function uri(uint256) view returns (string)',
]);

// ⚠️ Bloc de déploiement de la Factory. À vérifier/ajuster avec le vrai blockNumber
// du tx de création (visible sur Basescan -> onglet "Contract Creation").
// S'il est trop haut, d'anciens déploiements seront silencieusement ignorés.
const FACTORY_DEPLOY_BLOCK = 44040000n;
const CHUNK_SIZE = 2000n;

// `ReturnType<typeof createPublicClient>` résout sur les paramètres génériques PAR
// DÉFAUT de la fonction (pas sur { chain: baseSepolia }), ce qui donne un PublicClient
// "générique" incompatible avec l'instance réelle (Base a des formatters de chain
// spécifiques, ex. les tx de type "deposit", d'où l'erreur TS2345 sur getBlock()).
// En passant par une factory concrète (non générique), le type se déduit correctement.
const createAppPublicClient = () =>
  createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

type AppPublicClient = ReturnType<typeof createAppPublicClient>;

export interface DeploymentRecord {
  id: string;
  type: string;
  address: string;
  txHash: string;
  tabCategory: string;
  name?: string;
  symbol?: string;
  imageUrl?: string;
  description?: string;
  socials?: Record<string, string>;
  blockNumber: bigint;
}

interface DeploymentHistoryProps {
  address?: `0x${string}`;
  activeTab: string;
  explorerUrl: string;
  refreshTrigger: string;
  onSelectRecord: (record: DeploymentRecord) => void;
}

const resolveIpfsUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
};

const SOCIAL_BASE_URL: Record<string, string> = {
  twitter: 'https://x.com/',
  telegram: 'https://t.me/',
  farcaster: 'https://warpcast.com/',
  discord: 'https://discord.gg/',
  github: 'https://github.com/',
};

// Transforme un handle ("@twitter"), un domaine sans protocole ("github.com")
// ou une URL déjà complète en URL absolue cliquable.
const normalizeSocialUrl = (platform: string, raw: string): string => {
  let value = (raw || '').trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) return value;

  value = value.replace(/^@/, '');

  const base = SOCIAL_BASE_URL[platform];
  if (!base) return `https://${value}`; // website ou plateforme inconnue

  const domain = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (value.toLowerCase().startsWith(domain)) return `https://${value}`;

  return `${base}${value}`;
};

// contractType est un bytes32 "brut" (le literal string du contrat encodé tel quel,
// PAS un hash keccak) -> on le redécode en texte lisible.
const decodeContractType = (raw: `0x${string}`): string => {
  try {
    return hexToString(raw).replace(/\u0000+$/g, '');
  } catch {
    return raw;
  }
};

const mapTypeToTab = (typeName: string): string => {
  if (typeName.includes('B20')) return 'b20';
  if (typeName.includes('ERC20')) return 'token';
  if (typeName.includes('721')) return 'nft';
  if (typeName.includes('1155')) return 'erc1155';
  if (typeName.includes('Message')) return 'message';
  return 'simple';
};

export default function DeploymentHistory({ address, activeTab, explorerUrl, refreshTrigger, onSelectRecord }: DeploymentHistoryProps) {
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const enrichLog = useCallback(
    async (
      publicClient: AppPublicClient,
      log: Log<bigint, number, false, typeof PROXY_DEPLOYED_EVENT, true>
    ): Promise<DeploymentRecord> => {
      const args = log.args as unknown as {
        cloneAddress: `0x${string}`;
        implementation: `0x${string}`;
        contractType: `0x${string}`;
        deployer: `0x${string}`;
        isWhiteLabeled: boolean;
      };

      const deployedAddress = args.cloneAddress;
      const typeName = decodeContractType(args.contractType);
      const txHash = log.transactionHash as string;

      let tokenName = '';
      let tokenSymbol = '';
      let imageUrl = '';
      let description = '';
      let metadataUri = '';
      let socials: Record<string, string> = {};

      // name()/symbol() n'existent pas pour "Message" / "SimpleContract"
      if (typeName !== 'Message' && typeName !== 'SimpleContract') {
        try {
          tokenName = (await publicClient.readContract({
            address: deployedAddress,
            abi: CONTRACT_ABI,
            functionName: 'name',
          })) as string;
        } catch {
          // pas grave, on affichera le type brut à la place
        }
        try {
          tokenSymbol = (await publicClient.readContract({
            address: deployedAddress,
            abi: CONTRACT_ABI,
            functionName: 'symbol',
          })) as string;
        } catch {
          // idem
        }
      }

      // contractURI() -> seuls les contrats "Advanced" (721A / 1155) l'implémentent (ERC1046).
      // On tente quand même pour tous, avec fallback sur uri(0) pour l'ERC1155.
      try {
        metadataUri = (await publicClient.readContract({
          address: deployedAddress,
          abi: CONTRACT_ABI,
          functionName: 'contractURI',
        })) as string;
      } catch {
        if (typeName.includes('1155')) {
          try {
            metadataUri = (await publicClient.readContract({
              address: deployedAddress,
              abi: CONTRACT_ABI,
              functionName: 'uri',
              args: [0n],
            })) as string;
          } catch {
            // pas de metadata disponible
          }
        }
      }

      if (metadataUri) {
        try {
          const res = await fetch(resolveIpfsUrl(metadataUri));
          if (res.ok) {
            const meta = await res.json();
            imageUrl = resolveIpfsUrl(meta.image);
            description = meta.description || '';

            // Les socials sont stockés au format "contract-level metadata" (OpenSea) :
            // external_link pour le site, attributes[] (trait_type/value) pour le reste.
            if (meta.external_link) socials.website = meta.external_link;

            if (meta.external_link) socials.website = normalizeSocialUrl('website', meta.external_link);

            if (Array.isArray(meta.attributes)) {
              const knownKeys = ['twitter', 'discord', 'farcaster', 'telegram', 'github'];
              for (const attr of meta.attributes) {
                const key = (attr?.trait_type || '').toLowerCase();
                if (knownKeys.includes(key) && attr.value) {
                  socials[key] = normalizeSocialUrl(key, attr.value);
                }
              }
            }
          }
        } catch {
          // metadata IPFS injoignable, on affiche quand même le contrat
        }
      }

      return {
        id: `${txHash}-${log.logIndex}`,
        type: typeName,
        address: deployedAddress,
        txHash,
        tabCategory: mapTypeToTab(typeName),
        name: tokenName,
        symbol: tokenSymbol,
        imageUrl,
        description,
        socials,
        blockNumber: log.blockNumber as bigint,
      };
    },
    []
  );

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    const publicClient = createAppPublicClient();

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const latestBlock = await publicClient.getBlockNumber();
        let allLogs: Log[] = [];

        for (let from = FACTORY_DEPLOY_BLOCK; from <= latestBlock; from += CHUNK_SIZE) {
          const to = from + CHUNK_SIZE - 1n > latestBlock ? latestBlock : from + CHUNK_SIZE - 1n;
          try {
            const logs = await publicClient.getLogs({
              address: FACTORY_ADDRESS as `0x${string}`,
              event: PROXY_DEPLOYED_EVENT,
              fromBlock: from,
              toBlock: to,
            });
            allLogs = allLogs.concat(logs);
          } catch (err) {
            console.warn(`Erreur sur les blocs ${from}-${to}`, err);
          }
        }

        // "deployer" n'est PAS indexed on-chain -> impossible de filtrer via les topics,
        // le filtrage par adresse se fait donc côté client, après décodage.
        const ownLogs = allLogs.filter(
          (log) => ((log as any).args?.deployer as string)?.toLowerCase() === address.toLowerCase()
        );

        const enriched = await Promise.all(ownLogs.map((log) => enrichLog(publicClient, log as any)));
        enriched.forEach((r) => seenIds.current.add(r.id));
        enriched.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        if (!cancelled) setDeployments(enriched);
      } catch (error) {
        console.error('Viem Error:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadHistory();

    // Écoute live: chaque nouveau déploiement (le tien ou celui d'un autre wallet)
    // apparaît immédiatement, sans recharger toute la page.
    const unwatch = publicClient.watchEvent({
      address: FACTORY_ADDRESS as `0x${string}`,
      event: PROXY_DEPLOYED_EVENT,
      onLogs: async (logs) => {
        const mine = logs.filter(
          (log) => ((log as any).args?.deployer as string)?.toLowerCase() === address.toLowerCase()
        );
        if (mine.length === 0) return;

        const fresh = mine.filter((log) => !seenIds.current.has(`${log.transactionHash}-${log.logIndex}`));
        if (fresh.length === 0) return;

        const newRecords = await Promise.all(fresh.map((log) => enrichLog(publicClient, log as any)));
        newRecords.forEach((r) => seenIds.current.add(r.id));

        setDeployments((prev) => [...newRecords, ...prev]);
      },
    });

    return () => {
      cancelled = true;
      unwatch();
    };
  }, [address, refreshTrigger, enrichLog]);

  const filteredDeployments = deployments.filter((dep) => dep.tabCategory === activeTab);

  if (!address) return null;

  return (
    <div className="bg-card border border-card rounded-2xl overflow-hidden mt-2 animate-in fade-in duration-500">
      <div className={`p-6 flex justify-between items-center ${filteredDeployments.length === 0 ? 'border-b border-card' : ''}`}>
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <i className="fi fi-rr-time-past text-accent"></i> On-Chain History
          </h3>
        </div>
        {isLoading ? (
          <div className="text-accent flex items-center gap-2 text-sm">
            <i className="fi fi-rr-spinner animate-spin"></i> Reading Contracts...
          </div>
        ) : (
          <div className="text-secondary text-sm">
            {filteredDeployments.length} contracts forged
          </div>
        )}
      </div>

      {!isLoading && filteredDeployments.length === 0 ? (
        <div className="p-6 text-sm text-secondary text-center">Aucun déploiement pour cet onglet pour le moment.</div>
      ) : (
        <div className="px-2 max-h-[500px] overflow-y-auto">
          {filteredDeployments.map((record) => (
            <div
              key={record.id}
              onClick={() => onSelectRecord(record)}
              className="p-4 border-t border-card flex items-center justify-between gap-4 hover:bg-background/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {record.imageUrl ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-background shrink-0 border border-card">
                    <img src={record.imageUrl} alt="Token logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xl shrink-0 border border-accent/20">
                    <i className="fi fi-rr-document-signed"></i>
                  </div>
                )}

                <div>
                  <h4 className="text-foreground font-medium flex items-center gap-2">
                    {record.name ? `${record.name} ${record.symbol ? `(${record.symbol})` : ''}` : record.type}
                  </h4>
                  <div className="text-sm text-secondary flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold bg-card border border-card px-2 py-0.5 rounded-md text-accent">
                      {record.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Icône de navigation pour indiquer que c'est cliquable */}
              <div className="text-secondary opacity-50 flex items-center">
                <i className="fi fi-rr-angle-right"></i>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}