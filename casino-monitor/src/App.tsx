/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Terminal, 
  Wifi, 
  WifiOff, 
  Search,
  ArrowRight,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

interface Message {
  id: string;
  topic: string;
  payload: string;
  timestamp: string;
  type: "audit" | "alert";
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"disconnected" | "connected" | "error">("disconnected");
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket: Socket = io();

    socket.on("solace:status", (newStatus) => {
      setStatus(newStatus);
    });

    socket.on("audit:message", (msg) => {
      setMessages(prev => [{
        ...msg,
        id: Math.random().toString(36).substr(2, 9),
        type: "audit"
      }, ...prev].slice(0, 100));
    });

    socket.on("audit:alert", (msg) => {
      setMessages(prev => [{
        ...msg,
        id: Math.random().toString(36).substr(2, 9),
        type: "alert"
      }, ...prev].slice(0, 100));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredMessages = messages.filter(m => 
    m.payload.toLowerCase().includes(filter.toLowerCase()) || 
    m.topic.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050507] text-slate-300 font-sans flex flex-col md:flex-row overflow-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Sidebar / Aside */}
      <aside className="w-full md:w-72 bg-[#0a0a0f] border-r border-slate-800/50 flex flex-col p-6 shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase italic">Solace Router</h1>
        </div>

        <nav className="space-y-8 flex-1">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold flex items-center gap-2">
              <Wifi className="w-3 h-3" /> Broker Connection
            </p>
            <div className={cn(
              "rounded-lg p-3 flex items-center gap-3 border transition-colors",
              status === "connected" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                status === "connected" ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              )}></div>
              <div className="text-xs font-medium uppercase font-mono tracking-wider">
                {status === "connected" ? "SOLACE_PROD_UP" : "BROKER_OFFLINE"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Subscription</p>
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 text-xs font-mono text-cyan-400">
              tablegame/audit
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Redirection Rule</p>
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 text-[11px] font-mono text-amber-400/80 leading-relaxed">
              <span className="text-amber-500 font-bold italic">IF</span> "High Risk"<br/>
              <span className="text-amber-500 font-bold italic">GOTO</span> tablegame/table{"{N}"}/alert
            </div>
          </div>
        </nav>

        <div className="mt-auto border-t border-slate-800/50 pt-6">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">v2.4.1 Stable Build</p>
            <p className="text-[9px] text-slate-600 mt-1 uppercase font-mono">Uptime: 432h 12m</p>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full bg-[radial-gradient(circle_at_50%_-20%,_#1a1a2e_0%,_#050507_100%)] relative">
        {/* Workspace Header */}
        <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm">
          <div className="flex gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Inbound Flow</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono text-white font-bold">{messages.length}</span>
                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-tighter">Packets</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Safety Filter</span>
              <span className="text-2xl font-mono text-cyan-400 font-bold uppercase italic tracking-tighter">Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="SEARCH STREAMS..."
                className="bg-slate-900/50 border border-slate-800 rounded-full pl-9 pr-6 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all w-[240px] placeholder:text-slate-700"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="px-3 py-1 rounded-full border border-slate-700 text-[10px] bg-slate-900 font-mono text-slate-400">
              CPU: 4.2%
            </div>
          </div>
        </header>

        {/* Data Grid */}
        <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)] overflow-hidden">
          {/* Feed Column */}
          <section className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider">
                <span className="w-1.5 h-4 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
                Inbound Feed <span className="opacity-30 text-[10px] ml-1">(Audit)</span>
              </h2>
              <span className="text-[10px] text-cyan-400/80 font-mono animate-pulse uppercase tracking-[0.2em]">Streaming...</span>
            </div>
            
            <div className="flex-1 bg-black/40 border border-slate-800 rounded-xl overflow-hidden font-mono text-[11px] flex flex-col shadow-inner backdrop-blur-sm">
              <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                <span>Timestamp</span>
                <span>Payload Data</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {messages.filter(m => m.type === "audit").length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-700 uppercase tracking-widest font-bold italic opacity-30">
                      Empty Pipe
                    </div>
                  ) : (
                    messages.filter(m => m.type === "audit").map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "px-3 py-2 flex gap-4 transition-colors rounded hover:bg-slate-800/30",
                          msg.payload.includes("High Risk") ? "text-red-400 bg-red-950/10 border-l-2 border-red-500" : "text-slate-400"
                        )}
                      >
                        <span className="opacity-40 flex-shrink-0">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="break-all line-clamp-2">{msg.payload}</span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Alert Column */}
          <section className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider">
                <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                Redirections <span className="opacity-30 text-[10px] ml-1">(Alerts)</span>
              </h2>
              <span className="px-2 py-0.5 rounded bg-red-900/40 text-red-400 text-[10px] border border-red-700/50 font-bold uppercase font-mono">
                {messages.filter(m => m.type === "alert").length} Detected
              </span>
            </div>

            <div className="flex-1 bg-[#0f0f1a] border border-amber-900/20 rounded-xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {messages.filter(m => m.type === "alert").length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20 text-slate-400">
                      <ShieldAlert className="w-12 h-12" />
                      <p className="font-mono text-[10px] uppercase font-bold tracking-widest">No Alerts Triggered</p>
                    </div>
                  ) : (
                    messages.filter(m => m.type === "alert").map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-red-500/5 border-l-4 border-red-500 p-4 rounded shadow-[inset_0_0_20px_rgba(239,68,68,0.05)] border border-red-500/10"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">
                            Route: {msg.topic}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-mono italic">
                          {msg.payload}
                        </p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="h-12 bg-black/40 border-t border-slate-800/50 flex items-center px-4 justify-between">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                </div>
                <button 
                  onClick={() => setMessages(prev => prev.filter(m => m.type !== "alert"))}
                  className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest font-bold font-mono transition-colors"
                >
                  Clear Alert History
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Global Footer */}
        <footer className="h-10 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/50 px-8 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex gap-6 items-center">
            <span className="tracking-widest">PROCESS_ID: 9928</span>
            <span className="w-px h-3 bg-slate-800"></span>
            <span className="tracking-widest uppercase">Node: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="uppercase font-bold tracking-tighter">System Stable</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
