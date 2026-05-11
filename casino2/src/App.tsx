/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coins, User, Table as TableIcon, Send, Terminal, Zap, ShieldCheck, Trophy } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface BetResult {
  topic: string;
  payload: {
    userID: string;
    betAmount: number;
    tableno: string;
    dealerID: string;
    winlose: string;
    timestamp: string;
    status?: string;
    payout?: number;
    message?: string;
    [key: string]: any;
  };
  timestamp: number;
}

export default function App() {
  const [userID, setUsername] = useState("000001");
  const [dealerID, setDealerID] = useState("D000001");
  const [winlose, setWinlose] = useState("L");
  const [betAmount, setBetAmount] = useState(100);
  const [tableNo, setTableNo] = useState("00003");
  const now: Date = new Date();
  const [timestamp, setTimestamp] = useState(now);
  const [logs, setLogs] = useState<BetResult[]>([]);
  const [isBetting, setIsBetting] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("solace-message", (data: any) => {
      setLogs((prev) => [
        { ...data, timestamp: Date.now() },
        ...prev.slice(0, 49) // Keep last 50 logs
      ]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleBet = async () => {
    console.log("**** Bet submitted on handleBet");
    if (!userID || betAmount <= 0) return;

    setIsBetting(true);
    try {
      const response = await fetch("/api/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID,
          betAmount,
          tableNo,
          dealerID,
          winlose,
          timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place bet");
      }
      
      const result = await response.json();
      console.log("Bet submitted:", result);
    } catch (error) {
      console.error(error);
      console.log(error);
      alert("Error placing bet. Check console.");
    } finally {
      setTimeout(() => setIsBetting(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-[#F8FAFC]">
      {/* Header */}
      <header className="px-10 py-6 border-b border-white/10 bg-slate-900/80 flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Active Session</span>
          <div className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#38BDF8]" />
            Vegas Premier Table #{tableNo}
          </div>
        </div>
        
        <div className="flex gap-10">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Username</span>
            <span className="text-xl font-bold text-[#38BDF8]">{userID}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">System Status</span>
            <div className="flex items-center gap-2 justify-end">
              <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-[#4ADE80]' : 'bg-red-500'}`} />
              <span className="text-xl font-bold text-[#38BDF8]">
                {socket?.connected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Table Area */}
      <main className="flex-1 overflow-hidden p-10 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-[#064E3B] border-[12px] border-[#92400E] rounded-[500px] w-full max-w-[800px] aspect-[2/1] shadow-[inset_0_0_100px_rgba(0,0,0,0.5),0_20px_50px_rgba(0,0,0,0.3)] flex flex-col justify-center items-center overflow-hidden"
        >
          {/* Decorative Chips */}
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-[20%] left-[30%] w-10 h-10 rounded-full border-4 border-dashed border-white/50 bg-[#EF4444] shadow-lg" 
          />
          <motion.div 
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-[25%] right-[35%] w-10 h-10 rounded-full border-4 border-dashed border-white/50 bg-[#F59E0B] shadow-lg" 
          />

          <div className="border-2 border-white/20 w-[80%] h-[60%] rounded-[400px] flex justify-center items-center relative">
            <span className="text-2xl font-extrabold uppercase tracking-[0.2em] opacity-30 text-white select-none">
              No More Bets
            </span>
          </div>
          
          <div className="mt-5 font-bold text-[#92400E] uppercase text-sm tracking-widest bg-[#064E3B] px-4 py-1 z-10">
            Solace Broker Link Active
          </div>
        </motion.div>
      </main>

      {/* Betting Controls Footer */}
      <footer className="px-10 py-8 bg-[#1E293B] border-t border-white/10 flex items-center justify-between gap-8 shrink-0">
        <div className="flex items-center gap-10">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Table No</label>
            <input
              type="text"
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] text-white px-4 py-3 rounded-lg text-base w-48 outline-none focus:border-[#38BDF8] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Dealer ID</label>
            <input
              type="text"
              value={dealerID}
              onChange={(e) => setDealerID(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] text-white px-4 py-3 rounded-lg text-base w-48 outline-none focus:border-[#38BDF8] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">WinLose</label>
            <input
              type="text"
              value={winlose}
              onChange={(e) => setWinlose(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] text-white px-4 py-3 rounded-lg text-base w-48 outline-none focus:border-[#38BDF8] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Player Name</label>
            <input
              type="text"
              value={userID}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] text-white px-4 py-3 rounded-lg text-base w-48 outline-none focus:border-[#38BDF8] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Bet Amount</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#38BDF8]">$</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="bg-[#0F172A] border border-[#334155] text-white pl-8 pr-4 py-3 rounded-lg text-base w-32 outline-none focus:border-[#38BDF8] transition-colors font-bold"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#7dd3fc' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBet}
                disabled={isBetting}
                className="bg-[#38BDF8] text-[#0F172A] font-bold px-8 py-3 rounded-lg uppercase tracking-wide disabled:opacity-50 flex items-center gap-2"
              >
                {isBetting ? <div className="w-5 h-5 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" /> : 'Bet Result'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Solace Log Feed */}
        <div className="relative bg-[#0F172A] border border-[#334155] rounded-xl h-24 w-full max-w-[450px] p-3 flex flex-col font-mono text-[12px] text-[#38BDF8] overflow-hidden group">
          <div className="absolute top-0 right-0 px-2 py-1 bg-[#334155] text-[#94A3B8] text-[8px] rounded-bl-lg uppercase tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
            Solace Event Stream
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar scroll-smooth">
            <AnimatePresence initial={false}>
              {logs.length === 0 && (
                <div className="opacity-40 italic py-2">Waiting for events...</div>
              )}
              {logs.map((log) => (
                <motion.div
                  key={log.timestamp}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="break-all"
                >
                  <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString('en-GB', { hour12: false })}]</span>{" "}
                  {log.payload.status === 'win' ? (
                    <span className="text-[#4ADE80] font-bold underline decoration-dotted">WIN: +${log.payload.payout}</span>
                  ) : (
                    <span>PUB: {log.topic} {log.payload.userID} ${log.payload.betAmount} {log.payload.tableno} {log.payload.timestamp} </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
