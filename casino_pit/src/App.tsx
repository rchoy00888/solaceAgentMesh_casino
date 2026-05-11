/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, LayoutGrid, Settings2, Bell, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SolaceClient } from './lib/solace';

const TABLE_COUNT = 10;

interface TableState {
  id: number;
  isAlerted: boolean;
  lastAlertTime: string | null;
}

export default function App() {
  const [tables, setTables] = useState<TableState[]>(
    Array.from({ length: TABLE_COUNT }, (_, i) => ({
      id: i + 1,
      isAlerted: false,
      lastAlertTime: null,
    }))
  );

  const [connected, setConnected] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
/*  console.log("URL: ", url, vpn, username, password); */
  const [config, setConfig] = useState({
    url: import.meta.env.VITE_SOLACE_HOST || '',
    vpn: import.meta.env.VITE_SOLACE_VPN || '',
    username: import.meta.env.VITE_SOLACE_USERNAME || '',
    password: import.meta.env.VITE_SOLACE_PASSWORD || '',
  });

  const handleAlert = useCallback((id: number) => {
    setTables(prev => prev.map(t => 
      t.id === id ? { ...t, isAlerted: true, lastAlertTime: new Date().toLocaleTimeString() } : t
    ));
  }, []);

  const handleClear = useCallback((id: number) => {
    setTables(prev => prev.map(t => 
      t.id === id ? { ...t, isAlerted: false } : t
    ));
  }, []);

  useEffect(() => {
    if (!config.url || !config.vpn || !config.username) return;

    const solace = SolaceClient.getInstance();
    solace.connect({
      url: config.url,
      vpnName: config.vpn,
      userName: config.username,
      password: config.password,
    }).then(() => {
      setConnected(true);
      
      // Subscribe to all tables
      const unsubscribers = Array.from({ length: TABLE_COUNT }, (_, i) => {
        const id = i + 1;
        return solace.subscribe(`tablegame/${id}/alert`, () => {
          handleAlert(id);
        });
      });

      return () => unsubscribers.forEach(unsub => unsub());
    }).catch(err => {
      console.error('Failed to connect to Solace:', err);
      setConnected(false);
    });
  }, [config, handleAlert]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500 selection:text-[#050505]">
      {/* Header */}
      <header className="max-w-[1600px] mx-auto p-8 border-b border-white/10 flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[10px] font-mono tracking-[0.3em] text-emerald-500 uppercase mb-2">Solace Event Broker / Monitoring System</h1>
          <h2 className="text-4xl font-light tracking-tighter">FLOOR <span className="font-bold">ALPHA</span> COMMAND</h2>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex gap-8 text-right">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Broker Status</p>
              <div className="flex items-center justify-end gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                <p className={`text-sm font-mono ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {connected ? 'CONNECTED' : 'DISCONNECTED'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Active Streams</p>
              <p className="text-sm font-mono tracking-tight">{tables.filter(t => !t.isAlerted).length} / {TABLE_COUNT}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="p-3 border border-white/10 rounded-lg transition-all hover:bg-white/5 active:scale-95"
            title="Broker Configuration"
          >
            <Settings2 size={20} className="text-white/60" />
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8">
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12 border border-white/10 bg-[#111111] rounded-xl"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Broker URL</label>
                  <input 
                    className="p-3 bg-black border border-white/10 rounded font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    value={config.url}
                    onChange={e => setConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="wss://..."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Message VPN</label>
                  <input 
                    className="p-3 bg-black border border-white/10 rounded font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    value={config.vpn}
                    onChange={e => setConfig(prev => ({ ...prev, vpn: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Username</label>
                  <input 
                    className="p-3 bg-black border border-white/10 rounded font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    value={config.username}
                    onChange={e => setConfig(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2 relative">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Password</label>
                  <input 
                    type="password"
                    className="p-3 bg-black border border-white/10 rounded font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    value={config.password}
                    onChange={e => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
              <div className="px-8 pb-8 flex justify-between items-center">
                <p className="font-mono text-[10px] text-white/40 max-w-sm">
                  System monitors topics: <span className="text-emerald-500/60 font-bold">tablegame/&lt;id&gt;/alert</span>
                </p>
                <button 
                  onClick={() => {
                    const randomId = Math.floor(Math.random() * TABLE_COUNT) + 1;
                    handleAlert(randomId);
                  }}
                  className="px-6 py-2 bg-white/5 border border-white/10 rounded font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Simulate Random Alert
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <motion.div
              key={table.id}
              layout
              className={`relative border rounded-xl p-5 flex flex-col justify-between min-h-[220px] transition-all duration-500 ${
                table.isAlerted 
                  ? 'bg-[#2D0A0A] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] overflow-hidden animate-pulse-slow' 
                  : 'bg-[#111111] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-mono ${table.isAlerted ? 'text-red-200/60' : 'text-white/40'}`}>
                  T-{String(table.id).padStart(2, '0')}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  table.isAlerted 
                    ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' 
                    : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                }`} />
              </div>

              <div className="my-6">
                <h3 className={`text-xl font-medium tracking-tight ${table.isAlerted ? 'text-red-100 font-bold' : 'text-white/90'}`}>
                  {table.id % 3 === 0 ? 'BACCARAT' : table.id % 2 === 0 ? 'ROULETTE' : 'BLACKJACK'}
                </h3>
                {table.isAlerted ? (
                  <p className="text-xs text-red-400 font-mono font-bold mt-1 uppercase tracking-wider">CRITICAL ALERT</p>
                ) : (
                  <p className="text-[10px] text-white/30 font-mono mt-1">tablegame/{table.id}/alert</p>
                )}
              </div>

              <div>
                <AnimatePresence mode="wait">
                  {table.isAlerted ? (
                    <motion.button
                      key="clear"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleClear(table.id)}
                      className="w-full py-3 bg-red-600 border border-red-400 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded shadow-lg shadow-red-900/40 hover:bg-red-500 transition-colors"
                    >
                      Acknowledge & Clear
                    </motion.button>
                  ) : (
                    <div className="w-full py-3 bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider font-bold rounded text-white/20 text-center cursor-default">
                      Normal Mode
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Alert timestamp overlay */}
              {table.isAlerted && (
                <div className="absolute top-0 right-0 p-1 opacity-20 transform translate-y-12 -translate-x-2">
                  <AlertTriangle size={80} className="text-red-500" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto mt-16 px-8 pb-12 flex justify-between items-center border-t border-white/10 pt-8">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white/60 flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            LOG: Listening for events on broker: {config.url || 'None'}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Secure Data Link</span>
            <span className="text-[10px] font-mono text-emerald-500/60 uppercase">Real-time Stream Active</span>
          </div>
          <ShieldAlert size={20} className="text-white/20" />
        </div>
      </footer>
    </div>
  );
}
