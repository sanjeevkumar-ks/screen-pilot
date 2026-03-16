"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CommandCenter from "@/components/CommandCenter";
import ScreenViewer from "@/components/ScreenViewer";
import IntelligencePanel from "@/components/IntelligencePanel";

const API_BASE_URL = "http://localhost:8000";

export default function Home() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<any>({
    status: "idle",
    logs: [],
    last_screenshot: null
  });
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll for task status
  useEffect(() => {
    let interval: any;
    if (taskId && (taskStatus.status === "running" || taskStatus.status === "starting" || taskStatus.status === "thinking" || taskStatus.status === "executing")) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/task/${taskId}`);
          const rawLogs = response.data.logs || [];
          
          // Parse logs: separate chat from technical
          const chatFromLogs = rawLogs
            .filter((l: string) => l.startsWith("User:") || l.startsWith("Agent:"))
            .map((l: string) => ({
              role: l.startsWith("User:") ? "user" : "ai",
              content: l.replace(/^(User:|Agent:)\s*/i, "")
            }));
          
          const technicalLogs = rawLogs.filter((l: string) => !l.startsWith("User:") && !l.startsWith("Agent:"));

          setChatHistory(chatFromLogs);

          let displayStatus = response.data.status;
          if (displayStatus === "running") {
            const lastLog = technicalLogs[technicalLogs.length - 1]?.toLowerCase() || "";
            if (lastLog.includes("thinking") || lastLog.includes("analyzing") || lastLog.includes("neural")) displayStatus = "thinking";
            else if (lastLog.includes("executing") || lastLog.includes("clicking") || lastLog.includes("typing") || lastLog.includes("navigating")) displayStatus = "executing";
          }

          setTaskStatus({
            ...response.data,
            logs: technicalLogs,
            status: displayStatus === "stopped" ? "failed" : displayStatus
          });
          
          if (response.data.status === "completed" || response.data.status === "failed" || response.data.status === "stopped") {
            setIsProcessing(false);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error polling task:", error);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [taskId, taskStatus.status]);

  const handleSendCommand = async (command: string) => {
    setIsProcessing(true);
    // Initial UI state - will be overwritten by logs
    setChatHistory(prev => [...prev, { role: "user", content: command }]);
    
    setTaskStatus({ 
      status: "thinking", 
      logs: ["Neural connection established...", "Awaiting backend confirmation..."], 
      last_screenshot: taskStatus.last_screenshot 
    });

    try {
      const formData = new FormData();
      formData.append("command", command);
      
      const response = await axios.post(`${API_BASE_URL}/execute-task`, formData);
      setTaskId(response.data.task_id);
    } catch (error) {
      console.error("Error starting task:", error);
      setTaskStatus({ 
        status: "failed", 
        logs: ["ERR: Connection lost with backend engine."], 
        last_screenshot: null 
      });
      setIsProcessing(false);
    }
  };

  const handleStopTask = async () => {
    if (!taskId || !isProcessing) return;
    try {
      const formData = new FormData();
      formData.append("task_id", taskId);
      await axios.post(`${API_BASE_URL}/stop-task`, formData);
      setIsProcessing(false);
      setTaskStatus(prev => ({ ...prev, status: "idle" }));
    } catch (error) {
      console.error("Error stopping task:", error);
    }
  };

  return (
    <DashboardLayout status={taskStatus.status}>
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr_400px] h-full xl:h-full overflow-y-auto xl:overflow-hidden">
        {/* Left: Command Console / Chat */}
        <div className="h-[600px] xl:h-full border-b xl:border-b-0 xl:border-r border-white/5">
          <CommandCenter 
            onSendCommand={handleSendCommand}
            onStopTask={handleStopTask}
            isProcessing={isProcessing}
            status={taskStatus.status}
            chatHistory={chatHistory}
          />
        </div>

        {/* Center: Live Preview */}
        <div className="h-[500px] xl:h-full border-b xl:border-b-0 border-white/5">
          <ScreenViewer 
            screenshot={taskStatus.last_screenshot}
            status={taskStatus.status}
          />
        </div>

        {/* Right: Agent Reasoning & Logs */}
        <div className="h-[500px] xl:h-full">
          <IntelligencePanel 
            logs={taskStatus.logs}
            status={taskStatus.status}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
