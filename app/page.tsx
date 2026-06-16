'use client'; // Indique à Next.js que cette page interagit avec le navigateur de l'utilisateur

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

// ==========================================
// ⚠️ COLLEZ VOTRE ABI ET BYTECODE ICI ⚠️
// ==========================================
const ABI =[
	{
		"inputs": [],
		"stateMutability": "payable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "message",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const BYTECODE = "60a06040526040518060400160405280601381526020017f4775696c64205461736b205665726966696564000000000000000000000000008152505f908161004791906103c2565b5073460db3eb9d0049f729e75c223ed7e1c84fd7b61373ffffffffffffffffffffffffffffffffffffffff1660809073ffffffffffffffffffffffffffffffffffffffff16815250651b48eb57e0003410156100d8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100cf906104eb565b60405180910390fd5b5f60805173ffffffffffffffffffffffffffffffffffffffff16346040516100ff90610536565b5f6040518083038185875af1925050503d805f8114610139576040519150601f19603f3d011682016040523d82523d5f602084013e61013e565b606091505b5050905080610182576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610179906105ba565b60405180910390fd5b506105d8565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061020357607f821691505b602082108103610216576102156101bf565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026102787fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261023d565b610282868361023d565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f6102c66102c16102bc8461029a565b6102a3565b61029a565b9050919050565b5f819050919050565b6102df836102ac565b6102f36102eb826102cd565b848454610249565b825550505050565b5f90565b6103076102fb565b6103128184846102d6565b505050565b5b818110156103355761032a5f826102ff565b600181019050610318565b5050565b601f82111561037a5761034b8161021c565b6103548461022e565b81016020851015610363578190505b61037761036f8561022e565b830182610317565b50505b505050565b5f82821c905092915050565b5f61039a5f198460080261037f565b1980831691505092915050565b5f6103b2838361038b565b9150826002028217905092915050565b6103cb82610188565b67ffffffffffffffff8111156103e4576103e3610192565b5b6103ee82546101ec565b6103f9828285610339565b5f60209050601f83116001811461042a575f8415610418578287015190505b61042285826103a7565b865550610489565b601f1984166104388661021c565b5f5b8281101561045f5784890151825560018201915060208501945060208101905061043a565b8683101561047c5784890151610478601f89168261038b565b8355505b6001600288020188555050505b505050505050565b5f82825260208201905092915050565b7f4672616973206465207365727669636520696e737566666973616e74730000005f82015250565b5f6104d5601d83610491565b91506104e0826104a1565b602082019050919050565b5f6020820190508181035f830152610502816104c9565b9050919050565b5f81905092915050565b50565b5f6105215f83610509565b915061052c82610513565b5f82019050919050565b5f61054082610516565b9150819050919050565b7f457272657572206c6f7273206465206c27656e766f69206465206c6120636f6d5f8201527f6d697373696f6e00000000000000000000000000000000000000000000000000602082015250565b5f6105a4602783610491565b91506105af8261054a565b604082019050919050565b5f6020820190508181035f8301526105d181610598565b9050919050565b6080516102b86105ef5f395f607601526102b85ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c80638da5cb5b14610038578063e21f37ce14610056575b5f80fd5b610040610074565b60405161004d9190610162565b60405180910390f35b61005e610098565b60405161006b9190610205565b60405180910390f35b7f000000000000000000000000000000000000000000000000000000000000000081565b5f80546100a490610252565b80601f01602080910402602001604051908101604052809291908181526020018280546100d090610252565b801561011b5780601f106100f25761010080835404028352916020019161011b565b820191905f5260205f20905b8154815290600101906020018083116100fe57829003601f168201915b505050505081565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61014c82610123565b9050919050565b61015c81610142565b82525050565b5f6020820190506101755f830184610153565b92915050565b5f81519050919050565b5f82825260208201905092915050565b5f5b838110156101b2578082015181840152602081019050610197565b5f8484015250505050565b5f601f19601f8301169050919050565b5f6101d78261017b565b6101e18185610185565b93506101f1818560208601610195565b6101fa816101bd565b840191505092915050565b5f6020820190508181035f83015261021d81846101cd565b905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061026957607f821691505b60208210810361027c5761027b610225565b5b5091905056fea26469706673582212205ae7236fbb942cb5b0ceff83ce01767d3b5d1cfdb20b1a07a2885cc9881ddc7864736f6c63430008140033"; // N'oubliez pas les guillemets autour du 0x...
// ==========================================

export default function Home() {
  // Wagmi nous dit si l'utilisateur a connecté son portefeuille
  const { isConnected } = useAccount();
  
  // États pour gérer l'affichage de l'interface
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // La fonction principale qui s'active au clic
  const deployerContrat = async () => {
    setIsLoading(true);
    setError('');
    setTxHash('');

    try {
      // 1. On se connecte au MetaMask de l'utilisateur (sans JAMAIS voir sa clé privée)
      if (!window.ethereum) throw new Error("MetaMask n'est pas détecté");
      
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      // 2. On prépare l'usine à contrats
      const factory = new ethers.ContractFactory(ABI, BYTECODE, signer);

      // 3. On lance le déploiement en incluant vos frais de service (0.0001 ETH)
      console.log("Veuillez valider la transaction dans votre portefeuille...");
      const fraisDeService = ethers.parseEther("0.0001");
      
      const contract = await factory.deploy({ value: fraisDeService });

      // 4. On attend que la blockchain valide la transaction
      const receipt = await contract.deploymentTransaction()?.wait();
      
      if (receipt) {
        setTxHash(receipt.hash);
        console.log("Succès ! Contrat déployé à l'adresse :", await contract.getAddress());
      }

    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="text-center z-10 max-w-2xl w-full items-center justify-between font-mono text-sm border border-slate-800 bg-slate-900/50 p-12 rounded-2xl shadow-2xl">
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          Auto-Deployer Base
        </h1>
        
        <p className="mb-8 text-slate-400 text-base">
          Déployez un contrat unique en un clic. <br/>
          <span className="text-blue-400 font-semibold">Frais de service : 0.00003 ETH</span>
        </p>

        <div className="flex flex-col items-center gap-6">
          {/* Bouton de connexion RainbowKit */}
          <ConnectButton />

          {/* Bouton de déploiement (visible uniquement si connecté) */}
          {isConnected && (
            <button 
              onClick={deployerContrat}
              disabled={isLoading}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                isLoading 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }`}
            >
              {isLoading ? 'Déploiement en cours (Validation MetaMask)...' : '🚀 Déployer le Contrat'}
            </button>
          )}

          {/* Affichage des messages de succès ou d'erreur */}
          {txHash && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400">
              🎉 Déploiement réussi ! <br/>
              <a 
                href={`https://basescan.org/tx/${txHash}`} 
                target="_blank" 
                rel="noreferrer"
                className="underline hover:text-green-300"
              >
                Voir sur Basescan
              </a>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm max-w-full overflow-hidden text-ellipsis">
              ❌ {error}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}