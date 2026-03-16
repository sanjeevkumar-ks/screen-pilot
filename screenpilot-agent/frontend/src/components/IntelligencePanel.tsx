"use client";

import React, { useEffect, useRef } from "react";
import { Brain, ListTodo, CheckCircle2, CircleDashed, AlertCircle, Info, Compass, Target, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IntelligencePanelProps {
  logs: string[];
  status: string;
}

export default function IntelligencePanel({ logs, status }: IntelligencePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const steps = [
    { id: "analyze", label: "Protocol Analysis", icon: Compass },
    { id: "detect", label: "UI Recognition", icon: Target },
    { id: "exec", label: "Autonomous Execution", icon: ListTodo },
  ];

  const getActiveStep = (): string => {
    if (status === "thinking") return "analyze";
    if (status === "executing") return "exec"; // Changed from detect to match step id
    if (status === "completed") return "done";
    return "idle";
  };

  const activeStepId = getActiveStep();

  const getLogDetails = (log: string) => {
    const l = log.toLowerCase();
    if (l.includes("error")) return { type: "ERR", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/10" };
    if (l.includes("ai thought:") || l.includes("system:")) return { type: "AI", icon: Brain, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/10" };
    if (l.includes("executing:") || l.includes("navigating")) return { type: "ACT", icon: Play, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/10" };
    if (l.includes("completed") || l.includes("finalized")) return { type: "SYS", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/10" };
    return { type: "LOG", icon: Info, color: "text-slate-400", bg: "bg-slate-800/30", border: "border-white/5" };
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30 border-l border-white/5 p-6 gap-8">
      {/* Agent Thinking Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400">
            <Brain size={18} />
          </div>
          <h2 className="font-bold text-slate-100 tracking-tight">Agent Intelligence</h2>
        </div>

        <div className="flex flex-col gap-3">
          {steps.map((step, i) => {
            const isActive = activeStepId === step.id;
            const isCompleted = (activeStepId === "done") || 
                               (activeStepId === "exec" && i < 2) || 
                               (activeStepId === "detect" && i < 1);
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                  isActive 
                    ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-100 shadow-[0_0_20px_rgba(79,70,229,0.1)]" 
                    : isCompleted 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                      : "bg-slate-900/30 border-white/5 text-slate-500"
                }`}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute -inset-1.5 border border-indigo-500/50 rounded-lg"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                  {isCompleted ? <CheckCircle2 size={16} /> : <step.icon size={16} />}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest flex-1">{step.label}</span>
                {isActive && (
                   <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   >
                    <CircleDashed size={14} className="opacity-50" />
                   </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Log */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <ListTodo size={12} />
            <span>Operational Log</span>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-2 pr-2 pb-10"
        >
          <AnimatePresence initial={false}>
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                <Brain size={48} className="translate-y-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">Awaiting System<br/>Directives</span>
              </div>
            ) : (
              logs.map((log, i) => {
                const details = getLogDetails(log);
                const Icon = details.icon;
                const content = log.replace(/AI Thought: |Executing: |System: /gi, "");

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-xl border ${details.border} ${details.bg} flex gap-3 group`}
                  >
                    <div className={`mt-0.5 ${details.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                      <Icon size={12} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-[8px] font-black uppercase tracking-tighter ${details.color} opacity-40`}>
                        {details.type}
                      </span>
                      <p className="text-[11px] font-medium leading-relaxed text-slate-300">
                        {content}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      {status === "executing" && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-center gap-2"
        >
          <ArrowRight size={12} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Processing Data Flow</span>
        </motion.div>
      )}
    </div>
  );
}

import { Play } from "lucide-react";
