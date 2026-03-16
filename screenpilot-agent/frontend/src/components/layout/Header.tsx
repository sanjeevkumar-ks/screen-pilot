"use client";

import React from "react";
import { Cpu, Settings, CircleDashed, Mic, Brain, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  status: string;
}

export default function Header({ status }: HeaderProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "listening":
        return { 
          icon: Mic, 
          text: "Listening", 
          color: "text-amber-400", 
          bg: "bg-amber-400/10",
          border: "border-amber-400/20"
        };
      case "thinking":
        return { 
          icon: Brain, 
          text: "Thinking", 
          color: "text-indigo-400", 
          bg: "bg-indigo-400/10",
          border: "border-indigo-400/20"
        };
      case "executing":
        return { 
          icon: Play, 
          text: "Executing", 
          color: "text-emerald-400", 
          bg: "bg-emerald-400/10",
          border: "border-emerald-400/20"
        };
      default:
        return { 
          icon: CircleDashed, 
          text: "Agent Idle", 
          color: "text-slate-500", 
          bg: "bg-slate-500/10",
          border: "border-white/5"
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <header className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-10 z-50">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Cpu size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            ScreenPilot
          </h1>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1 pl-9">
          Multimodal AI UI Navigator
        </p>
      </div>

      <div className="flex items-center gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`flex items-center gap-3 px-4 py-2 rounded-full border ${config.border} ${config.bg}`}
          >
            <div className={`relative ${config.color}`}>
              {status !== "idle" && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`absolute inset-0 rounded-full ${config.bg}`}
                />
              )}
              <StatusIcon size={14} className={status === "thinking" ? "animate-spin-slow" : ""} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${config.color}`}>
              {config.text}
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="h-6 w-px bg-white/5" />

        <button className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
          <Settings size={20} className="group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    </header>
  );
}
