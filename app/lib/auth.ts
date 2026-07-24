import { createPublicClient, http, recoverMessageAddress } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { SignJWT, jwtVerify } from 'jose';

// ==========================================
// CONFIGURATION
// ==========================================

// L'adresse de ton contrat AirdropPublisher déployé à l'étape précédente
const PUBLISHER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_CONTRACT_ADDRESS as `0x${string}`;

// Clé secrète pour signer les sessions JWT
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nexulayer_fallback_secret_key_change_me_in_production'
);

// ABI minimaliste : nous n'avons besoin que de la fonction de vérification
const publisherAbi = [
  {
    inputs: [{ internalType: "address", name: "_account", "type": "address" }],
    name: "isPublisher",
    outputs: [{ internalType: "bool", name: "", "type": "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Initialisation du client Viem pour lire la blockchain
const publicClient = createPublicClient({
  // Utilise le réseau principal en production, sinon Sepolia
  chain: process.env.NODE_ENV === 'production' ? base : baseSepolia,
  transport: http() // Tu pourras passer une URL Alchemy/Infura ici si nécessaire
});

// ==========================================
// 1. AUTHENTIFICATION ON-CHAIN
// ==========================================

/**
 * Récupère l'adresse publique du portefeuille à partir du message original et de sa signature.
 */
export async function verifyWalletSignature(message: string, signature: `0x${string}`): Promise<`0x${string}` | null> {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature,
    });
    return recoveredAddress;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'adresse de signature :", error);
    return null;
  }
}

/**
 * Interroge le Smart Contract pour vérifier si l'adresse est autorisée (allowlistée).
 */
export async function isAddressPublisher(address: `0x${string}`): Promise<boolean> {
  if (!PUBLISHER_CONTRACT_ADDRESS) {
    console.error("L'adresse du contrat Publisher n'est pas définie dans les variables d'environnement.");
    return false;
  }

  try {
    const isPublisher = await publicClient.readContract({
      address: PUBLISHER_CONTRACT_ADDRESS,
      abi: publisherAbi,
      functionName: 'isPublisher',
      args: [address],
    });

    return isPublisher;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut d'éditeur sur le contrat :", error);
    return false;
  }
}

// ==========================================
// 2. GESTION DES SESSIONS OFF-CHAIN (JWT)
// ==========================================

/**
 * Crée un token JWT valide pour 24 heures après une authentification réussie.
 */
export async function createAdminSession(address: string): Promise<string> {
  const jwt = await new SignJWT({ address, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return jwt;
}

/**
 * Vérifie le token de session. À utiliser dans les Middlewares ou les routes /api/admin/*.
 */
export async function verifyAdminSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload; // Retourne le contenu (ex: { address, role, exp... })
  } catch (error) {
    return null; // Le token est invalide, expiré ou falsifié
  }
}
