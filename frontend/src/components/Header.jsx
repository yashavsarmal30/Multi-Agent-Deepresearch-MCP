import React from "react";
import { Sparkles, Settings, History, Globe, Cpu } from "lucide-react";

export default function Header({ onOpenSettings, onOpenHistory, config, historyCount }) {
  return (
    <header style={{
      padding: "1.25rem 0",
      borderBottom: "1px solid var(--border-color)",
      marginBottom: "2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "1rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
        }}>
          <Sparkles size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Deep Researcher
            </h1>
            <span style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              fontSize: "0.7rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "999px",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}>
              MCP & CrewAI
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Autonomous Multi-Agent Web Research & Report Synthesis
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Active Engine Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.4rem 0.75rem",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}>
          <Globe size={14} color="#60a5fa" />
          <span>{config?.default_search_engine === "linkup" ? "LinkUp Deep Search" : "DuckDuckGo (Free)"}</span>
        </div>

        {/* History Button */}
        <button
          onClick={onOpenHistory}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.9rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
        >
          <History size={16} />
          <span>History</span>
          {historyCount > 0 && (
            <span style={{
              background: "var(--accent-blue)",
              color: "#fff",
              fontSize: "0.7rem",
              borderRadius: "999px",
              padding: "1px 6px",
              marginLeft: "2px",
            }}>
              {historyCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.9rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
