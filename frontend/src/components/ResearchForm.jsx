import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ArrowUp, CornerDownLeft, Loader2, Sparkles, Globe, Cpu, Zap } from "lucide-react";

const SUGGESTED_TOPICS = [
  "Commercial status of Solid-State Batteries in 2026",
  "NIST Post-Quantum Cryptography algorithm adoption",
  "Autonomous Multi-Agent AI Frameworks comparison",
  "Next-generation nuclear SMR deployment milestones",
];

export default function ResearchForm({ onStartResearch, isLoading, config }) {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState("standard");
  const [searchEngine, setSearchEngine] = useState("auto");
  const [provider, setProvider] = useState("gemini");

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      <Card className="relative overflow-hidden rounded-xl border bg-card p-3 shadow-sm transition-all focus-within:ring-1 focus-within:ring-ring">
        <form onSubmit={handleSubmit}>
          {/* Text Input Area */}
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={2}
            placeholder="What would you like to investigate? (Press Enter to search, Shift+Enter for new line)"
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm sm:text-base outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
          />

          {/* Bottom Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 mt-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Depth Segmented Toggle */}
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDepth("standard")}
                  className={`rounded-md px-2 py-1 font-medium transition-all ${
                    depth === "standard"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setDepth("deep")}
                  className={`rounded-md px-2 py-1 font-medium transition-all ${
                    depth === "deep"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Deep
                </button>
              </div>

              {/* Engine Selector */}
              <div className="relative">
                <select
                  value={searchEngine}
                  onChange={(e) => setSearchEngine(e.target.value)}
                  disabled={isLoading}
                  className="h-7 rounded-md border bg-background px-2 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus:ring-1 focus:ring-ring"
                >
                  <option value="auto">Search: Auto (LinkUp / DDG)</option>
                  <option value="duckduckgo">Search: DuckDuckGo (Free)</option>
                  <option value="linkup">Search: LinkUp (Deep Web)</option>
                </select>
              </div>

              {/* Model Provider Selector */}
              <div className="relative">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  disabled={isLoading}
                  className="h-7 rounded-md border bg-background px-2 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus:ring-1 focus:ring-ring"
                >
                  <option value="gemini">Model: Google Gemini (Gemini 3.6 Flash)</option>
                  <option value="openai">Model: OpenAI (GPT-4o)</option>
                  <option value="groq">Model: Groq (Llama-3.3-70B)</option>
                  <option value="anthropic">Model: Anthropic (Claude 3.5)</option>
                  <option value="ollama">Model: Local Ollama</option>
                  <option value="auto">Model: Auto Detect</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="sm"
              disabled={!query.trim() || isLoading}
              className="h-8 gap-1.5 px-3 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ArrowUp className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Suggestion Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1 text-xs text-muted-foreground">
        <span className="text-[11px] font-medium text-muted-foreground/70">Suggestions:</span>
        {SUGGESTED_TOPICS.map((topic, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setQuery(topic)}
            disabled={isLoading}
            className="rounded-md border bg-muted/20 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
