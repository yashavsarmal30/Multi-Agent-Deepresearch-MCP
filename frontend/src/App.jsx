import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ResearchForm from "./components/ResearchForm";
import AgentProgress from "./components/AgentProgress";
import ReportView from "./components/ReportView";
import HistoryDrawer from "./components/HistoryDrawer";
import SettingsModal from "./components/SettingsModal";
import { AlertCircle, Search, Compass, ShieldCheck } from "lucide-react";

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
  const [isDark, setIsDark] = useState(true);

  // Sync dark class on mount and change
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

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
      console.warn("Could not fetch config:", err);
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

    const linkupKey = localStorage.getItem("linkup_api_key") || "";
    const geminiKey = localStorage.getItem("gemini_api_key") || "";
    const openaiKey = localStorage.getItem("openai_api_key") || "";
    const groqKey = localStorage.getItem("groq_api_key") || "";

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        config={config}
        historyCount={history.length}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Content Area */}
      <main className="container max-w-4xl px-4 py-8 sm:py-12">
        {/* Hero Title (minimal) */}
        {!activeReport && (
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              What do you want to explore?
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Autonomous multi-agent research powered by CrewAI, LinkUp, and DuckDuckGo.
            </p>
          </div>
        )}

        {/* Search & Configuration Input */}
        <ResearchForm
          onStartResearch={handleStartResearch}
          isLoading={isLoading}
          config={config}
        />

        {/* Error Alert */}
        {error && (
          <div className="my-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold">Research Error</h4>
              <p className="text-muted-foreground">{error}</p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="mt-2 inline-block rounded-md border border-destructive/40 bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                Open Settings to configure API Keys
              </button>
            </div>
          </div>
        )}

        {/* Live Pipeline Tracker */}
        {isLoading && (
          <AgentProgress
            currentStage={currentStage}
            stageMessage={stageMessage}
          />
        )}

        {/* Report Viewer */}
        {activeReport && (
          <ReportView result={activeReport} />
        )}
      </main>

      {/* Slide-over History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectReport={handleSelectReport}
        onDeleteReport={handleDeleteReport}
      />

      {/* Settings Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
