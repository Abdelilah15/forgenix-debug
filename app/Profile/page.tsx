"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import DashboardLayout from '../../components/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AssetList from '../../components/AssetList';

interface UserProfile {
  username: string;
  address: string;
  role: string;
  avatar: string;
  joinedAt: string;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [timeframe, setTimeframe] = useState('1M');
  const [chartData, setChartData] = useState<{ date: string, balance: number }[]>([]);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [assets, setAssets] = useState([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Chargement de l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      if (address) {
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      }
    };
    if (isConnected) fetchUser();
  }, [address, isConnected]);

  // 2. Le Moteur du Graphique Blindé
  useEffect(() => {
    if (!address) return;

    const fetchPortfolioHistory = async () => {
      try {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, timeframe }),
        });

        if (res.ok) {
          const json = await res.json();
          setTotalBalance(json.totalBalance);

          // Fonction utile pour formater les dates
          const formatTime = (d: Date) => timeframe === '1J'
            ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

          // CORRECTION 1 : Si on a de vraies données
          if (json.chartData && json.chartData.length > 0) {
            const formattedData = json.chartData.map((point: any) => ({
              date: formatTime(new Date(point.timestamp)),
              balance: point.balance
            }));

            // Si on a un seul point, on crée un point de départ factice pour pouvoir tracer une ligne
            if (formattedData.length === 1) {
              const startDate = new Date();
              if (timeframe === '1J') startDate.setDate(startDate.getDate() - 1);
              else if (timeframe === '1S') startDate.setDate(startDate.getDate() - 7);
              else if (timeframe === '1M') startDate.setMonth(startDate.getMonth() - 1);
              else if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
              else if (timeframe === '1A') startDate.setFullYear(startDate.getFullYear() - 1);
              else if (timeframe === 'Max') startDate.setFullYear(startDate.getFullYear() - 3);

              setChartData([{ date: formatTime(startDate), balance: formattedData[0].balance }, formattedData[0]]);

            } else {
              setChartData(formattedData);
              setAssets(json.assets || []);
            }
          } else {
            // CORRECTION 2 : Si la base renvoie [] (Nouveau wallet ou solde 0)
            // On crée une fausse ligne plate à 0$ pour que le graphique reste beau à l'écran !
            const startDate = new Date();
            if (timeframe === '1J') startDate.setDate(startDate.getDate() - 1);
            else if (timeframe === '1S') startDate.setDate(startDate.getDate() - 7);
            else if (timeframe === '1M') startDate.setMonth(startDate.getMonth() - 1);
            else if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
            else if (timeframe === '1A') startDate.setFullYear(startDate.getFullYear() - 1);
            else if (timeframe === 'Max') startDate.setFullYear(startDate.getFullYear() - 3);

            setChartData([
              { date: formatTime(startDate), balance: json.totalBalance || 0 },
              { date: formatTime(new Date()), balance: json.totalBalance || 0 }
            ]);
          }
        }
      } catch (error) {
        console.error("Erreur Graphique :", error);
      }
    };

    fetchPortfolioHistory();
  }, [address, timeframe]);

  // Fonctions d'édition...
  const handleEditClick = () => { if (user) { setEditUsername(user.username); setEditAvatar(user.avatar); setIsEditing(true); } };
  const handleShuffleAvatar = () => { setEditAvatar(`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${Math.random().toString(36).substring(7)}`); };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Image trop lourde (Max 2 Mo).");
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const handleSave = async () => {
    setIsSaving(true);
    const res = await fetch('/api/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, username: editUsername, avatar: editAvatar }) });
    if (res.ok) { setUser(await res.json()); setIsEditing(false); window.dispatchEvent(new Event('profileUpdated')); }
    setIsSaving(false);
  };

  return (
    <DashboardLayout title="Mon Profil">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CARTE 1 : Informations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden min-h-[320px]">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600/20 to-cyan-400/20"></div>
            {!isEditing ? (
              <div className="relative z-10 w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="relative w-24 h-24 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl overflow-hidden mb-4">
                  {user?.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full animate-pulse bg-slate-800"></div>}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{user ? user.username : 'Chargement...'}</h2>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <i className="fi fi-brands-ethereum text-indigo-400 text-sm"></i>
                  <p className="text-xs font-mono text-slate-400">{address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '0x000...0000'}</p>
                </div>
                <button onClick={handleEditClick} className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2">
                  Éditer le profil
                </button>
              </div>
            ) : (
              <div className="relative z-10 w-full flex flex-col items-center animate-in fade-in duration-300">
                {/* Interface d'édition simplifiée pour la lisibilité du code ici */}
                <div onClick={handleShuffleAvatar} className="relative w-24 h-24 rounded-full border-4 border-indigo-500 bg-slate-800 shadow-xl overflow-hidden mb-4 cursor-pointer">
                  <img src={editAvatar} alt="Profile Edit" className="w-full h-full object-cover" />
                </div>
                <div className="w-full mb-5">
                  <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} maxLength={15} className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-2 outline-none text-center" />
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-800 text-white py-2 rounded-xl">Annuler</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl">{isSaving ? '...' : 'Enregistrer'}</button>
                </div>
              </div>
            )}
          </div>

          {/* CARTE 2 : Le Graphique */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-slate-400 text-sm font-medium">Actif Total (USD)</h3>
                <p className="text-2xl font-bold text-white mt-1">
                  {totalBalance !== null ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                </p>
              </div>
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
                {['1J', '1S', '1M', '3M', '1A', 'Max'].map((tf) => (
                  <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === tf ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-900'}`}>{tf}</button>
                ))}
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} minTickGap={20} />

                  {/* CORRECTION 3 : L'Axe Y est maintenant dynamique pour éviter le "Crush" du graphique */}
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={60}
                    domain={[
                      (dataMin: number) => (dataMin === 0 ? 0 : dataMin * 0.9), // Marge de 10% en bas
                      (dataMax: number) => (dataMax === 0 ? 100 : dataMax * 1.1) // Marge de 10% en haut
                    ]}
                  />

                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                    formatter={(value: any) => [`$${value.toLocaleString('en-US')}`, 'Valeur']}
                  />

                  <Area type="monotone" dataKey="balance" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECTION 3 : Onglets */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center">
          <button onClick={() => setActiveTab('details')} className={`flex-1 flex justify-center py-2.5 text-sm rounded-lg ${activeTab === 'details' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Actifs en détail</button>
          <button onClick={() => setActiveTab('analysis')} className={`flex-1 flex justify-center py-2.5 text-sm rounded-lg ${activeTab === 'analysis' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Analyse du portefeuille</button>
        </div>
        <div className="min-h-[300px] border border-slate-800 rounded-2xl bg-slate-900 p-6">
          {activeTab === 'details' ? (
            <AssetList assets={assets} />
          ) : (
            <p className="text-slate-500 text-sm">Analyse DeFi à venir...</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}