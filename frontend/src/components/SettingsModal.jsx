import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ExternalLink, Check } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, config, onSaveConfig }) {
  const [geminiKey, setGeminiKey] = useState("");
  const [linkupKey, setLinkupKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    setLinkupKey(localStorage.getItem("linkup_api_key") || "");
    setGeminiKey(localStorage.getItem("gemini_api_key") || "");
    setOpenaiKey(localStorage.getItem("openai_api_key") || "");
    setGroqKey(localStorage.getItem("groq_api_key") || "");
    setAnthropicKey(localStorage.getItem("anthropic_api_key") || "");
    setOllamaUrl(localStorage.getItem("ollama_base_url") || "http://localhost:11434");
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");

    if (linkupKey) localStorage.setItem("linkup_api_key", linkupKey);
    if (geminiKey) localStorage.setItem("gemini_api_key", geminiKey);
    if (openaiKey) localStorage.setItem("openai_api_key", openaiKey);
    if (groqKey) localStorage.setItem("groq_api_key", groqKey);
    if (anthropicKey) localStorage.setItem("anthropic_api_key", anthropicKey);
    if (ollamaUrl) localStorage.setItem("ollama_base_url", ollamaUrl);

    const payload = {};
    if (linkupKey) payload.linkup_api_key = linkupKey;
    if (geminiKey) payload.gemini_api_key = geminiKey;
    if (openaiKey) payload.openai_api_key = openaiKey;
    if (groqKey) payload.groq_api_key = groqKey;
    if (anthropicKey) payload.anthropic_api_key = anthropicKey;
    if (ollamaUrl) payload.ollama_base_url = ollamaUrl;

    await onSaveConfig(payload);
    setSaveStatus("saved");
    setTimeout(() => {
      setSaveStatus("");
      onClose();
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold">
            API Keys & Providers
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure keys for your browser session. Free DuckDuckGo search works without any API key.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3.5 py-2">
          {/* Google Gemini */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-foreground">Google Gemini API Key</label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Get AI Studio key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <Input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={config?.providers?.gemini ? "•••••••••••• (Configured via env)" : "AIzaSy..."}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* LinkUp Search */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-foreground">LinkUp API Key (Optional)</label>
              <a
                href="https://app.linkup.so/sign-up"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Sign up <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <Input
              type="password"
              value={linkupKey}
              onChange={(e) => setLinkupKey(e.target.value)}
              placeholder={config?.providers?.linkup ? "•••••••••••• (Configured via env)" : "Enter LinkUp key"}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* OpenAI */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">OpenAI API Key (Optional)</label>
            <Input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={config?.providers?.openai ? "•••••••••••• (Configured via env)" : "sk-..."}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Groq */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Groq API Key (Optional)</label>
            <Input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder={config?.providers?.groq ? "•••••••••••• (Configured via env)" : "gsk_..."}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Ollama Local URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Ollama Base URL (Local)</label>
            <Input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="h-8 text-xs font-mono"
            />
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveStatus === "saving"}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              {saveStatus === "saved" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Keys</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
