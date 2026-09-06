import React, { useEffect, useState } from "react";
import { Search, Brain, FileText, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function AgentProgress({ currentStage, stageMessage }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}m ` : ""}${s}s`;
  };

  const stages = [
    {
      id: "searching",
      title: "Lead Web Researcher",
      desc: "Decomposing query, harvesting live sources & links",
      icon: Search,
      color: "#3b82f6",
    },
    {
      id: "analyzing",
      title: "Principal Research Analyst",
      desc: "Cross-referencing citations, analyzing data & nuances",
      icon: Brain,
      color: "#8b5cf6",
    },
    {
      id: "writing",
      title: "Senior Technical Writer",
      desc: "Structuring publication report with citations",
      icon: FileText,
      color: "#10b981",
    },
  ];

  // Map stage to step index
  const getStepStatus = (index) => {
    if (currentStage === "complete") return "done";
    if (currentStage === "writing") {
      if (index <= 1) return "done";
      if (index === 2) return "active";
    }
    if (currentStage === "analyzing") {
      if (index === 0) return "done";
      if (index === 1) return "active";
      return "pending";
    }
    if (currentStage === "searching" || currentStage === "planning" || currentStage === "init") {
      if (index === 0) return "active";
      return "pending";
    }
    return "pending";
  };

  return (
    <div className="glass-card" style={{
      marginBottom: "2rem",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      background: "linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.5rem",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="pulse-glow" style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#3b82f6",
          }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
            Multi-Agent Crew Assembled & Working
          </h3>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(0, 0, 0, 0.3)",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
        }}>
          <span>Elapsed:</span>
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Stage Message Banner */}
      {stageMessage && (
        <div style={{
          background: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "8px",
          padding: "0.75rem 1rem",
          fontSize: "0.9rem",
          color: "#93c5fd",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "1.5rem",
        }}>
          <Loader2 size={16} className="animate-spin" color="#60a5fa" />
          <span>{stageMessage}</span>
        </div>
      )}

      {/* 3-Step Multi-Agent Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem",
      }}>
        {stages.map((stg, idx) => {
          const status = getStepStatus(idx);
          const Icon = stg.icon;
          const isActive = status === "active";
          const isDone = status === "done";

          return (
            <div
              key={stg.id}
              style={{
                background: isActive
                  ? "rgba(59, 130, 246, 0.12)"
                  : isDone
                  ? "rgba(16, 185, 129, 0.08)"
                  : "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${
                  isActive
                    ? "rgba(59, 130, 246, 0.5)"
                    : isDone
                    ? "rgba(16, 185, 129, 0.3)"
                    : "rgba(255, 255, 255, 0.05)"
                }`,
                borderRadius: "12px",
                padding: "1rem",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: isActive ? stg.color : isDone ? "#10b981" : "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={18} color="#ffffff" />
                </div>
                {isDone ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : isActive ? (
                  <Loader2 size={20} color="#60a5fa" className="animate-spin" />
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Standby</span>
                )}
              </div>
              <h4 style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: isActive ? "#ffffff" : isDone ? "#e2e8f0" : "var(--text-secondary)",
                marginBottom: "0.2rem",
              }}>
                {stg.title}
              </h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {stg.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
