import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ResearchForm from "./components/ResearchForm";
import AgentProgress from "./components/AgentProgress";
import ReportView from "./components/ReportView";
import HistoryDrawer from "./components/HistoryDrawer";
import SettingsModal from "./components/SettingsModal";
import { AlertCircle, Sparkles, BookOpen, Compass } from "lucide-react";

export default function App() {
  const [config, setConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [stageMessage, setStageMessage] = useState("");
  const [activeReport, setActiveReport] = useState(null);
  const [error, setError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load config and history on mount
  useEffect(() => {
    fetchConfig();
    fetchHistory();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.warn("Could not fetch config from /api/config:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.warn("Could not fetch history:", err);
    }
  };

  const handleStartResearch = async (params) => {
    setIsLoading(true);
    setError(null);
    setActiveReport(null);
    setCurrentStage("init");
    setStageMessage(`Assembling research crew for "${params.query}"...`);

    // Pull any cached keys from localStorage
    const linkupKey = localStorage.getItem("linkup_api_key") || "";
    const openaiKey = localStorage.getItem("openai_api_key") || "";
    const groqKey = localStorage.getItem("groq_api_key") || "";
    const geminiKey = localStorage.getItem("gemini_api_key") || "";

    const queryParams = new URLSearchParams({
      query: params.query,
      depth: params.depth || "standard",
      search_engine: params.search_engine || "auto",
    });

    if (params.provider) queryParams.set("provider", params.provider);
    if (params.provider === "gemini" && geminiKey) queryParams.set("gemini_key", geminiKey);
    else if (openaiKey) queryParams.set("api_key", openaiKey);
    else if (groqKey) queryParams.set("api_key", groqKey);
    else if (geminiKey) queryParams.set("gemini_key", geminiKey);
    if (linkupKey) queryParams.set("linkup_key", linkupKey);

    // Use SSE stream
    try {
      const eventSource = new EventSource(`/api/research/stream?${queryParams.toString()}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "stage") {
            setCurrentStage(data.stage);
            setStageMessage(data.message);
          } else if (data.type === "complete") {
            eventSource.close();
            setIsLoading(false);
            setCurrentStage("complete");
            setActiveReport(data.result);
            fetchHistory();
          } else if (data.type === "error") {
            eventSource.close();
            setIsLoading(false);
            setCurrentStage(null);
            setError(data.error);
          }
        } catch (e) {
          console.error("Error parsing SSE event:", e);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error:", err);
        eventSource.close();

        // Fallback to direct POST request if SSE closes prematurely
        fallbackPostResearch(params, openaiKey || groqKey, linkupKey, geminiKey);
      };
    } catch (err) {
      fallbackPostResearch(params, openaiKey || groqKey, linkupKey, geminiKey);
    }
  };

  const fallbackPostResearch = async (params, apiKey, linkupKey, geminiKey) => {
    try {
      setStageMessage("Running research pipeline...");
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: params.query,
          depth: params.depth,
          search_engine: params.search_engine,
          provider: params.provider,
          api_key: apiKey || null,
          linkup_api_key: linkupKey || null,
          gemini_api_key: geminiKey || null,
        }),
      });

      const data = await res.json();
      setIsLoading(false);
      setCurrentStage(null);

      if (data.success) {
        setActiveReport(data);
        fetchHistory();
      } else {
        setError(data.error || "Research failed.");
      }
    } catch (err) {
      setIsLoading(false);
      setCurrentStage(null);
      setError(String(err));
    }
  };

  const handleSelectReport = async (filename) => {
    try {
      const res = await fetch(`/api/history/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        // Parse title from query or filename
        const cleanTitle = filename
          .replace(/^\d{8}_\d{6}_/, "")
          .replace(/\.md$/, "")
          .replace(/_/g, " ");

        setActiveReport({
          query: cleanTitle,
          report: data.content,
          saved_file: filename,
        });
      }
    } catch (err) {
      console.error("Failed to load report:", err);
    }
  };

  const handleDeleteReport = async (filename) => {
    try {
      const res = await fetch(`/api/history/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.filename !== filename));
        if (activeReport?.saved_file === filename) {
          setActiveReport(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  const handleSaveConfig = async (payload) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchConfig();
      }
    } catch (err) {
      console.error("Failed to update config:", err);
    }
  };

  return (
    <div>
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      <div className="container">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          config={config}
          historyCount={history.length}
        />

        {/* Search & Configuration Form */}
        <ResearchForm
          onStartResearch={handleStartResearch}
          isLoading={isLoading}
          config={config}
        />

        {/* Error Alert */}
        {error && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.8rem",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            color: "#fca5a5",
          }}>
            <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fecaca", marginBottom: "0.25rem" }}>
                Investigation Halted
              </h4>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                {error}
              </p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                style={{
                  marginTop: "0.6rem",
                  background: "rgba(239, 68, 68, 0.25)",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Configure API Keys in Settings
              </button>
            </div>
          </div>
        )}

        {/* Multi-Agent Live Execution Timeline */}
        {isLoading && (
          <AgentProgress
            currentStage={currentStage}
            stageMessage={stageMessage}
          />
        )}

        {/* Active Research Report View */}
        {activeReport && (
          <ReportView result={activeReport} />
        )}

        {/* Empty state welcome card when idle */}
        {!isLoading && !activeReport && !error && (
          <div className="glass-card" style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            border: "1px dashed var(--border-color)",
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "rgba(59, 130, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <Compass size={30} color="#60a5fa" />
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Autonomous Multi-Agent Web Research
            </h3>
            <p style={{
              maxWidth: "540px",
              margin: "0 auto 1.5rem",
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}>
              Ask complex research questions. The crew will formulate search queries, harvest live web sources with citations via LinkUp and DuckDuckGo, analyze conflicting findings, and compose a publication-grade report.
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "1.5rem",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}>
              <span>✓ No Auth Required</span>
              <span>✓ LinkUp & DuckDuckGo</span>
              <span>✓ MCP Server Included</span>
            </div>
          </div>
        )}
      </div>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectReport={handleSelectReport}
        onDeleteReport={handleDeleteReport}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
