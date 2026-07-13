// components/Footer.tsx
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 py-12 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Section Marque */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-2xl font-bold text-white tracking-tighter">
            Forgenix.
          </Link>
          <p className="text-sm">
            Be active on <span className="text-blue-500 font-semibold">base.</span>
          </p>
          <p className="text-xs mt-4 opacity-50">
            © {new Date().getFullYear()} Forgenix. Tous droits réservés.
          </p>
        </div>

        {/* Section Liens Utiles */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-semibold mb-2">Produit</h4>
          <Link href="/dashboard" className="hover:text-blue-500 transition-colors">Dashboard</Link>
          <Link href="/pricing" className="hover:text-blue-500 transition-colors">Tarifs</Link>
          <Link href="/forge" className="hover:text-blue-500 transition-colors">Forge</Link>
        </div>

        {/* Section Réseaux / Légal */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-semibold mb-2">Réseaux</h4>
          <a href="#" className="hover:text-blue-500 transition-colors">Twitter (X)</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Discord</a>
          <a href="#" className="hover:text-blue-500 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}