// app/page.tsx
import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      
      {/* Navbar simplifiée pour la Landing Page */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          {/* Vous pouvez remplacer le ⚡ par votre Logo (globe.svg ou window.svg) */}
          <span className="text-blue-500">⚡</span> Forgenix
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm font-medium text-gray-300 hover:text-white transition">
            Tarifs
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all"
          >
            Lancer l'App
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section (Inspiration Phantom) */}
        <section className="relative flex flex-col items-center justify-center text-center pt-32 pb-24 px-4 overflow-hidden">
          {/* Effet de lueur en arrière-plan (Glow effect) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 max-w-5xl">
            Be active on <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">base.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-12">
            La plateforme tout-en-un pour gérer vos actifs, déployer des contrats et forger le futur du Web3 sur le réseau Base.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/dashboard" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transform hover:-translate-y-1"
            >
              Connecter un Wallet
            </Link>
            <Link 
              href="/forge" 
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all backdrop-blur-sm"
            >
              Découvrir la Forge
            </Link>
          </div>
        </section>

        {/* Section Services */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Tout ce dont vous avez besoin.</h2>
            <p className="text-gray-400 text-lg">Des outils puissants conçus pour l'écosystème Base.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Service 1 : Portfolio */}
            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:bg-[#151515] hover:border-white/20 transition-all group">
              <div className="bg-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Gestion de Portfolio</h3>
              <p className="text-gray-400 leading-relaxed">
                Suivez vos tokens, analysez vos performances et gérez vos actifs sur Base avec une interface claire et précise.
              </p>
            </div>

            {/* Service 2 : Forge / Smart Contracts */}
            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:bg-[#151515] hover:border-white/20 transition-all group">
              <div className="bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                ⚒️
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Forgenix Deployer</h3>
              <p className="text-gray-400 leading-relaxed">
                Déployez vos smart contracts en quelques clics. Outils de test, vérification et intégration IPFS native.
              </p>
            </div>

            {/* Service 3 : Vitesse & Sécurité */}
            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:bg-[#151515] hover:border-white/20 transition-all group">
              <div className="bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Sécurité Maximale</h3>
              <p className="text-gray-400 leading-relaxed">
                Profitez de la rapidité et des frais réduits du layer 2 Base, avec une sécurité héritée d'Ethereum.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* Intégration du Footer */}
      <Footer />
    </div>
  );
}