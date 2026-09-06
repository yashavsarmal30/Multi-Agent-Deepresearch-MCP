import React, { useState } from "react";
import { Search, ArrowRight, Zap, Layers, Cpu, Compass } from "lucide-react";

const SAMPLE_QUERIES = [
  "Commercial readiness of Solid-State Batteries in 2026",
  "Autonomous Multi-Agent AI Frameworks comparison",
  "Post-Quantum Cryptography NIST standards adoption",
  "CRISPR gene editing recent clinical trial approvals",
];

export default function ResearchForm({ onStartResearch, isLoading, config }) {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState("standard");
  const [searchEngine, setSearchEngine] = useState("auto");
  const [provider, setProvider] = useState("auto");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onStartResearch({
      query: query.trim(),
      depth,
      search_engine: searchEngine,
      provider: provider === "auto" ? null : provider,
    });
  };

  const handleSelectSample = (sample) => {
    setQuery(sample);
  };

  return (
    <div className="glass-card" style={{ marginBottom: "2rem" }}>
      <form onSubmit={handleSubmit}>
        {/* Search Input Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.35)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "0.5rem 0.75rem",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--border-focus)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
        >
          <Search size={20} color="var(--text-secondary)" style={{ marginLeft: "0.5rem" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What topic would you like to investigate in depth?"
            disabled={isLoading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "1.05rem",
              padding: "0.75rem 1rem",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: query.trim() && !isLoading
                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                : "rgba(255, 255, 255, 0.08)",
              color: query.trim() && !isLoading ? "#ffffff" : "var(--text-muted)",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.4rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: query.trim() && !isLoading ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: query.trim() && !isLoading ? "0 4px 12px rgba(59, 130, 246, 0.4)" : "none",
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin" style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                }} />
                <span>Researching...</span>
              </>
            ) : (
              <>
                <span>Investigate</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Options Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginTop: "1.2rem",
          paddingTop: "1rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}>
          {/* Depth Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Zap size={14} color="#f59e0b" />
              Depth:
            </span>
            <div style={{
              display: "flex",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "2px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}>
              <button
                type="button"
                onClick={() => setDepth("standard")}
                style={{
                  background: depth === "standard" ? "rgba(59, 130, 246, 0.3)" : "transparent",
                  color: depth === "standard" ? "#93c5fd" : "var(--text-secondary)",
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setDepth("deep")}
                style={{
                  background: depth === "deep" ? "rgba(139, 92, 246, 0.3)" : "transparent",
                  color: depth === "deep" ? "#c4b5fd" : "var(--text-secondary)",
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Deep Research
              </button>
            </div>
          </div>

          {/* Search Engine Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Compass size={14} color="#60a5fa" />
              Search Engine:
            </span>
            <select
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="auto">Auto (LinkUp / DuckDuckGo)</option>
              <option value="duckduckgo">DuckDuckGo (Free, No Key)</option>
              <option value="linkup">LinkUp (Deep Web)</option>
            </select>
          </div>

          {/* Model Provider Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Cpu size={14} color="#a78bfa" />
              LLM:
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="auto">Auto ({config?.active_provider || "Detect"})</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="groq">Groq (Llama 3.3 70B Fast)</option>
              <option value="anthropic">Anthropic (Claude 3.5)</option>
              <option value="gemini">Google Gemini (Gemini 3.6 Pro)</option>
              <option value="ollama">Ollama Local (DeepSeek-R1)</option>
            </select>
          </div>
        </div>

        {/* Sample queries */}
        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Try:</span>
          {SAMPLE_QUERIES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "999px",
                padding: "3px 10px",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                e.currentTarget.style.color = "#93c5fd";
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
