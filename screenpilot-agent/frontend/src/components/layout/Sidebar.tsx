"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Terminal, 
  Layers, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Cpu
} from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Terminal, label: "Agent Console", active: false },
  { icon: Layers, label: "Automation Tasks", active: false },
  { icon: History, label: "Activity Logs", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 80 }}
      className="h-full bg-slate-900/50 border-r border-white/5 backdrop-blur-xl flex flex-col z-30 transition-all duration-300"
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <Cpu size={20} className="text-white" />
          </div>
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight"
            >
              ScreenPilot
            </motion.span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              item.active 
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            <item.icon size={20} />
            {isOpen && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </motion.aside>
  );
}
