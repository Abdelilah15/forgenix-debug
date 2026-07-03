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
  const hasFetchedPortfolio = useRef(false);

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

  useEffect(() => {
    if (!address) return;

    const fetchPortfolioHistory = async () => {
      hasFetchedPortfolio.current = true;

      try {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, timeframe }),
        });

        if (res.ok) {
          const json = await res.json();
          setTotalBalance(json.totalBalance ?? 0);
          setAssets(Array.isArray(json.assets) ? json.assets : []);

          const formatTime = (d: Date) => timeframe === '1D'
            ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

          if (json.chartData && json.chartData.length > 0) {
            const formattedData = json.chartData.map((point: any) => ({
              date: formatTime(new Date(point.timestamp)),
              balance: point.balance
            }));

            if (formattedData.length === 1) {
              const startDate = new Date();
              if (timeframe === '1D') startDate.setDate(startDate.getDate() - 1);
              else if (timeframe === '1W') startDate.setDate(startDate.getDate() - 7);
              else if (timeframe === '1M') startDate.setMonth(startDate.getMonth() - 1);
              else if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
              else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
              else if (timeframe === 'Max') startDate.setFullYear(startDate.getFullYear() - 3);

              setChartData([{ date: formatTime(startDate), balance: formattedData[0].balance }, formattedData[0]]);
            } else {
              setChartData(formattedData);
              setAssets(json.assets || []);
            }
          } else {
            const startDate = new Date();
            if (timeframe === '1D') startDate.setDate(startDate.getDate() - 1);
            else if (timeframe === '1W') startDate.setDate(startDate.getDate() - 7);
            else if (timeframe === '1M') startDate.setMonth(startDate.getMonth() - 1);
            else if (timeframe === '3M') startDate.setMonth(startDate.getMonth() - 3);
            else if (timeframe === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
            else if (timeframe === 'Max') startDate.setFullYear(startDate.getFullYear() - 3);

            setChartData([
              { date: formatTime(startDate), balance: json.totalBalance || 0 },
              { date: formatTime(new Date()), balance: json.totalBalance || 0 }
            ]);
          }
        }
      } catch (error) {
        console.error("Chart Error :", error);
      }
    };

    fetchPortfolioHistory();
  }, [address, timeframe]);

  useEffect(() => {
    hasFetchedPortfolio.current = false;
  }, [address, timeframe]);

  const handleEditClick = () => { if (user) { setEditUsername(user.username); setEditAvatar(user.avatar); setIsEditing(true); } };
  const handleShuffleAvatar = () => { setEditAvatar(`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${Math.random().toString(36).substring(7)}`); };
  const handleSave = async () => {
    setIsSaving(true);
    const res = await fetch('/api/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, username: editUsername, avatar: editAvatar }) });
    if (res.ok) { setUser(await res.json()); setIsEditing(false); window.dispatchEvent(new Event('profileUpdated')); }
    setIsSaving(false);
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CARD 1 : Info */}
          <div className="bg-card border border-card rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[320px]">
            <div className="absolute top-0 left-0 w-full h-24 bg-accent/10"></div>

            {!isEditing ? (
              <div className="relative z-10 w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                {/* Removed borders from avatar */}
                <div className="relative w-24 h-24 rounded-full bg-background border-3 overflow-hidden mb-4">
                  {user?.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full animate-pulse bg-background"></div>}
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">{user ? user.username : 'Loading...'}</h2>
                <div className="flex items-center gap-2 bg-background border border-card px-3 py-1.5 rounded-xl">
                  <i className="fi fi-brands-ethereum text-accent text-sm"></i>
                  <p className="text-xs font-mono text-secondary">{address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '0x000...0000'}</p>
                </div>
                <button onClick={handleEditClick} className="mt-6 w-full border border-card bg-background hover:bg-hover text-foreground text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="relative z-10 w-full flex flex-col items-center animate-in fade-in duration-300">
                <div onClick={handleShuffleAvatar} className="relative w-24 h-24 rounded-full bg-background border-3 overflow-hidden mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={editAvatar} alt="Profile Edit" className="w-full h-full object-cover" />
                </div>
                <div className="w-full mb-5">
                  <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} maxLength={15} className="w-full bg-background text-foreground rounded-xl border border-card px-4 py-2.5 outline-none text-center focus:ring-2 focus:ring-accent/20 transition-all" />
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setIsEditing(false)} className="flex-1 border border-card  text-foreground py-2.5 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 border border-[#2b7fff] text-[#2b7fff] py-2.5 rounded-xl transition-colors">{isSaving ? '...' : 'Save'}</button>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2 : Chart */}
          <div className="bg-card border border-card rounded-2xl p-6 lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-secondary text-sm font-medium">Total Asset (USD)</h3>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totalBalance !== null ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                </p>
              </div>
              <div className="bg-background p-1 rounded-xl border border-card flex items-center gap-1">
                {['1D', '1W', '1M', '3M', '1Y', 'Max'].map((tf) => (
                  <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1.5 text-xs  font-bold rounded-lg transition-colors ${timeframe === tf ? 'bg-[#2b7fff] text-white' : 'text-secondary hover:text-foreground'}`}>{tf}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} dy={10} minTickGap={20} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    width={60}
                    domain={[(dataMin: number) => (dataMin === 0 ? 0 : dataMin * 0.9), (dataMax: number) => (dataMax === 0 ? 100 : dataMax * 1.1)]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card-background)', borderColor: 'transparent', borderRadius: '12px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--text-secondary)', fontSize: '12px' }}
                    formatter={(value: any) => [`$${value.toLocaleString('en-US')}`, 'Value']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECTION 3 : Tabs & Content */}
        <div className="bg-card border border-card rounded-xl p-1.5 flex items-center">
          <button onClick={() => setActiveTab('details')} className={`flex-1 flex justify-center py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'details' ? 'bg-background text-[#2b7fff]' : 'text-secondary hover:text-foreground'}`}>Asset Details</button>
          <button onClick={() => setActiveTab('analysis')} className={`flex-1 flex justify-center py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'analysis' ? 'bg-background text-[#2b7fff]' : 'text-secondary hover:text-foreground'}`}>Portfolio Analysis</button>
        </div>

        <div className="min-h-[300px] rounded-2xl bg-card border border-card p-6">
          {activeTab === 'details' ? (
            <AssetList assets={assets} />
          ) : (
            <p className="text-secondary text-sm text-center py-10">DeFi Analysis coming soon...</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}