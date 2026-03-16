"use client";

import React from "react";
import { Monitor, Maximize2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface ScreenPreviewProps {
  screenshot: string | null;
  status: string;
}

export default function ScreenPreview({ screenshot, status }: ScreenPreviewProps) {
  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 font-medium text-slate-100">
          <div className="p-2 bg-slate-800/50 border border-white/5 rounded-lg text-indigo-400">
            <Monitor size={18} />
          </div>
          <span>Live Screen Analysis</span>
          {status === "running" && (
            <div className="ml-2 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:text-slate-100 transition-colors">
            <Maximize2 size={16} />
          </button>
          <button className="p-2 text-slate-500 hover:text-slate-100 transition-colors">
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
      
      <div className="relative flex-1 rounded-3xl overflow-hidden glass-card group transition-all duration-500 border-indigo-500/0 hover:border-indigo-500/20">
        <AnimatePresence mode="wait">
          {screenshot ? (
            <motion.div
              key={screenshot.slice(0, 30)}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full relative"
            >
              <img 
                src={`data:image/png;base64,${screenshot}`} 
                alt="Screen Preview" 
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
            </motion.div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4 bg-slate-900/30">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <Monitor size={64} className="opacity-20 translate-y-2" />
              </motion.div>
              <p className="text-sm font-medium tracking-wide">Waiting for system capture...</p>
            </div>
          )}
        </AnimatePresence>
        
        {status === "running" && (
          <motion.div 
            animate={{ 
              opacity: [0.05, 0.15, 0.05],
              backgroundPosition: ["0% 0%", "100% 100%"]
            }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none mix-blend-overlay"
          />
        )}
      </div>
    </div>
  );
}

// Ensure AnimatePresence is available
import { AnimatePresence } from "framer-motion";
