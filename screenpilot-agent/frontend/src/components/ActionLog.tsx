"use client";

import React, { useEffect, useRef } from "react";
import { ListTodo, CheckCircle2, CircleDashed, AlertCircle, Info, Brain, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActionLogProps {
  logs: string[];
  status: string;
}

export default function ActionLog({ logs, status }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogDetails = (log: string) => {
    const l = log.toLowerCase();
    if (log.startsWith("Agent:")) return { type: "chat", icon: Bot, color: "text-blue-400", bg: "bg-blue-600/10", border: "border-blue-500/20" };
    if (log.startsWith("User:")) return { type: "user", icon: User, color: "text-slate-100", bg: "bg-blue-600", border: "border-blue-500/20" };
    if (l.includes("error")) return { type: "error", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    if (l.includes("ai thought:")) return { type: "thought", icon: Brain, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
    if (l.includes("executing:")) return { type: "action", icon: ListTodo, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    if (l.includes("completed")) return { type: "success", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
    return { type: "system", icon: Info, color: "text-slate-400", bg: "bg-slate-800/50", border: "border-white/5" };
  };

  return (
    <div className="flex flex-col gap-6 h-full min-h-[500px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3 text-slate-100 font-medium">
          <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-400">
            <Bot size={18} />
          </div>
          <span>Chat & Activity</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          {logs.length} Total Events
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-800"
      >
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-slate-600 gap-3"
            >
              <CircleDashed size={32} className="opacity-10 animate-spin-slow" />
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-40">System Idle</p>
            </motion.div>
          ) : (
            logs.map((log, i) => {
              const details = getLogDetails(log);
              const Icon = details.icon;
              const isChat = details.type === "chat" || details.type === "user";
              const content = log.replace(/^(Agent:|User:|AI Thought:|Executing:)\s*/gi, "");
              
              if (isChat) {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${details.type === 'user' ? 'items-end' : 'items-start'} gap-1.5`}
                  >
                    <div className={`flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider ${details.type === 'user' ? 'text-slate-500' : 'text-blue-400'}`}>
                      <Icon size={12} /> {details.type}
                    </div>
                    <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                      details.type === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                    }`}>
                      {content}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  layout
                  className={`relative p-3 rounded-xl border ${details.border} ${details.bg} transition-all transition-duration-300 opacity-60 hover:opacity-100 group`}
                >
                  <div className="flex gap-3 relative z-10">
                    <div className={`mt-0.5 ${details.color}`}>
                      <Icon size={14} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">
                        {details.type}
                      </span>
                      <p className={`text-xs leading-relaxed font-medium ${details.type === 'system' ? 'text-slate-400' : 'text-slate-200'}`}>
                        {content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
      
      {status === "running" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3 text-xs text-indigo-400 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" />
          </div>
          <span className="uppercase tracking-[0.2em]">Processor Active</span>
        </motion.div>
      )}
    </div>
  );
}
