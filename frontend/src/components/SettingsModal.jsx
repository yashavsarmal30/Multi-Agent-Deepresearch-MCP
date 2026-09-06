import React, { useState, useEffect } from "react";
import { X, Key, Save, CheckCircle2, Globe, Cpu, ExternalLink } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, config, onSaveConfig }) {
  if (!isOpen) return null;

  const [linkupKey, setLinkupKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    // Load existing keys from localStorage if available
    setLinkupKey(localStorage.getItem("linkup_api_key") || "");
    setOpenaiKey(localStorage.getItem("openai_api_key") || "");
    setGroqKey(localStorage.getItem("groq_api_key") || "");
    setAnthropicKey(localStorage.getItem("anthropic_api_key") || "");
    setOllamaUrl(localStorage.getItem("ollama_base_url") || "http://localhost:11434");
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");

    // Save to localStorage
    if (linkupKey) localStorage.setItem("linkup_api_key", linkupKey);
    if (openaiKey) localStorage.setItem("openai_api_key", openaiKey);
    if (groqKey) localStorage.setItem("groq_api_key", groqKey);
    if (anthropicKey) localStorage.setItem("anthropic_api_key", anthropicKey);
    if (ollamaUrl) localStorage.setItem("ollama_base_url", ollamaUrl);

    // Update backend config
    const payload = {};
    if (linkupKey) payload.linkup_api_key = linkupKey;
    if (openaiKey) payload.openai_api_key = openaiKey;
    if (groqKey) payload.groq_api_key = groqKey;
    if (anthropicKey) payload.anthropic_api_key = anthropicKey;
    if (ollamaUrl) payload.ollama_base_url = ollamaUrl;

    await onSaveConfig(payload);
    setSaveStatus("saved");
    setTimeout(() => {
      setSaveStatus("");
      onClose();
    }, 1000);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)",
      zIndex: 110,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "#0f172a",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "520px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        overflow: "hidden",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Key size={20} color="#60a5fa" />
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff" }}>
              API Keys & Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Keys are saved in your local session. DuckDuckGo web search works free without any key!
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* LinkUp Key */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1" }}>
                  LinkUp API Key
                </label>
                <a
                  href="https://app.linkup.so/sign-up"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "0.75rem", color: "#60a5fa", display: "flex", alignItems: "center", gap: "2px" }}
                >
                  Get key <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="password"
                value={linkupKey}
                onChange={(e) => setLinkupKey(e.target.value)}
                placeholder={config?.providers?.linkup ? "●●●●●●●●●●●● (Configured via env)" : "Enter LinkUp API Key"}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                }}
              />
            </div>

            {/* OpenAI Key */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "0.35rem" }}>
                OpenAI API Key (Optional)
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder={config?.providers?.openai ? "●●●●●●●●●●●● (Configured via env)" : "sk-..."}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                }}
              />
            </div>

            {/* Groq Key */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "0.35rem" }}>
                Groq API Key (Fast & Free Tier)
              </label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder={config?.providers?.groq ? "●●●●●●●●●●●● (Configured via env)" : "gsk_..."}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                }}
              />
            </div>

            {/* Ollama Local URL */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "0.35rem" }}>
                Ollama Base URL (Local Models)
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.75rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-color)",
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.1rem",
                background: "transparent",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveStatus === "saving"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.3rem",
                background: saveStatus === "saved" ? "#10b981" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {saveStatus === "saved" ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
