"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceInputProps {
  onSendCommand: (command: string) => void;
  isProcessing: boolean;
}

export default function VoiceInput({ onSendCommand, isProcessing }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognition?.start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    if (transcript.trim() && !isProcessing) {
      onSendCommand(transcript);
      setTranscript("");
    }
  };

  return (
    <div className="w-full glass-card rounded-3xl p-8 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <Sparkles size={18} className="text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">AI Command Console</h2>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/50 border border-white/5 rounded-2xl p-2 pl-4 flex-1 transition-all focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={isProcessing}
            placeholder={isListening ? "Listening..." : "Tell the agent what to do..."}
            className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-600 font-medium py-3"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          
          <div className="flex items-center gap-2 pr-1">
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`p-3 rounded-xl transition-all relative group ${
                isListening 
                  ? "bg-red-500/20 text-red-500" 
                  : "bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20"
              } disabled:opacity-50`}
            >
              {isListening && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-red-500 rounded-xl"
                />
              )}
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              onClick={handleSend}
              disabled={isProcessing || !transcript.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-50 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white hover:text-indigo-600 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-indigo-600"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 justify-center text-indigo-400 text-xs font-medium"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    className="w-1 bg-indigo-500 rounded-full"
                  />
                ))}
              </div>
              <span className="uppercase tracking-widest ml-2">Voice Input Active</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
