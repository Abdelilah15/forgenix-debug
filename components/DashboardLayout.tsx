import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, title }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* La Sidebar n'a plus besoin d'arguments, elle se gère toute seule ! */}
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        {/* On passe le titre à la Topbar */}
        <Topbar title={title} />
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto w-full">
            {/* Le contenu de la page s'injecte ici */}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}