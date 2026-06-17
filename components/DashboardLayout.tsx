import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, activePage }: { children: React.ReactNode, activePage: string }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Sidebar activePage={activePage} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        <Topbar activePage={activePage} />
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* C'est ici que le contenu spécifique de chaque page sera injecté */}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}