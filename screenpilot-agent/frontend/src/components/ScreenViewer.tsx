"use client";

import React from "react";
import { Monitor, Maximize2, Layers, Search, Crosshair } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScreenViewerProps {
  screenshot: string | null;
  status: string;
}

export default function ScreenViewer({ screenshot, status }: ScreenViewerProps) {
  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 lg:p-10 gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Monitor size={18} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Live Screen Capture</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium pl-11 uppercase tracking-widest">
            {status === "executing" ? "Observing UI Elements..." : "Waiting for Protocol Start"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5">
            <Search size={14} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Zoom: 100%</span>
          </div>
          <button className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative glass-card rounded-[2.5rem] overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/5 hover:border-indigo-500/20 transition-all duration-700">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <AnimatePresence mode="wait">
          {screenshot ? (
            <motion.div
              key={screenshot.slice(0, 50)}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className="w-full h-full relative p-4 lg:p-8"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src={`data:image/png;base64,${screenshot}`} 
                  alt="UI Analysis" 
                  className="w-full h-full object-contain bg-slate-900"
                />
                
                {/* AI Detection Overlays (Mock) */}
                {status === "executing" && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-1/4 left-1/3 w-32 h-10 border-2 border-indigo-500 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center"
                    >
                      <Crosshair size={12} className="text-indigo-500 mr-2 animate-spin-slow" />
                      <span className="text-[8px] font-bold text-indigo-400 uppercase">Input Field Detected</span>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      className="absolute bottom-1/4 right-1/4 w-24 h-10 border-2 border-cyan-500 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center"
                    >
                      <Layers size={12} className="text-cyan-500 mr-2" />
                      <span className="text-[8px] font-bold text-cyan-400 uppercase">Button Detected</span>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute -inset-8 opacity-10"
                >
                  <Crosshair size={120} />
                </motion.div>
                <Monitor size={56} className="relative z-10 opacity-20" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-40">System Neutral</p>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="w-1 h-1 rounded-full bg-slate-500" 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Elements */}
        {screenshot && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 z-20">
            <div className={`h-2 w-2 rounded-full ${status === "executing" ? "bg-emerald-500 animate-pulse" : "bg-indigo-500"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
              {status === "executing" ? "Processing Multimodal Feed" : "Ready for Visual Analysis"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
