"use client";

import React, { useState } from "react";
import { Mic, MicOff, Send, History, Sparkles, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandCenterProps {
  onSendCommand: (command: string) => void;
  onStopTask: () => void;
  isProcessing: boolean;
  status: string;
  chatHistory: { role: string; content: string }[];
}

export default function CommandCenter({ onSendCommand, onStopTask, isProcessing, status, chatHistory }: CommandCenterProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendCommand(input);
      setInput("");
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setInput("Launch the IRCTC train search page.");
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30 border-r border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400">
            <Terminal size={18} />
          </div>
          <h2 className="font-bold text-slate-100 tracking-tight text-sm">Command Console</h2>
        </div>
        
        {isProcessing && (
          <button 
            onClick={onStopTask}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-red-500/20 transition-all"
          >
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Terminate Protocol
          </button>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20 opacity-30">
            <Sparkles size={40} className="text-indigo-400" />
            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
              Neural interface active.<br/>Awaiting operator command.
            </p>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-lg ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Modern AI Prompt Area */}
      <div className="p-6 bg-slate-950/50 backdrop-blur-md border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Find flights from Delhi to Mumbai under 5k"
              disabled={isProcessing}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-4 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all min-h-[80px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="flex items-center gap-3">
             <button
              type="button"
              onClick={toggleListening}
              disabled={isProcessing}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs transition-all ${
                isListening 
                  ? "bg-red-500/20 text-red-500 border border-red-500/30" 
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-white/5"
              }`}
            >
              {isListening ? (
                <div className="flex items-center gap-3">
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }} className="h-2 w-2 rounded-full bg-red-500" />
                  Capturing Audio...
                </div>
              ) : (
                <>
                  <Mic size={14} className="text-indigo-400" />
                  Voice Mode
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

