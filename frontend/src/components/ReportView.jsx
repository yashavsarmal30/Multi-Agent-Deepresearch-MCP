import React, { useMemo, useState } from "react";
import { marked } from "marked";
import { Copy, Download, Printer, Check, ExternalLink, BookOpen, Clock, FileText } from "lucide-react";

export default function ReportView({ result }) {
  const [copied, setCopied] = useState(false);

  const reportText = result?.report || "";
  const query = result?.query || "Research Report";

  // Parse markdown HTML
  const parsedHtml = useMemo(() => {
    try {
      return marked.parse(reportText);
    } catch {
      return `<pre>${reportText}</pre>`;
    }
  }, [reportText]);

  // Extract source links from markdown
  const sources = useMemo(() => {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const matches = [];
    let match;
    const seenUrls = new Set();
    while ((match = regex.exec(reportText)) !== null) {
      const [, title, url] = match;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        matches.push({ title, url });
      }
    }
    return matches;
  }, [reportText]);

  // Word count and reading time
  const stats = useMemo(() => {
    const words = reportText.trim().split(/\s+/).length;
    const readMinutes = Math.max(1, Math.round(words / 200));
    return { words, readMinutes };
  }, [reportText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `research_${query.slice(0, 30).replace(/\s+/g, "_")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card" style={{ marginBottom: "3rem" }}>
      {/* Top Action Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        paddingBottom: "1.2rem",
        marginBottom: "1.5rem",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "999px",
            }}>
              Synthesis Complete
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={13} /> {stats.readMinutes} min read ({stats.words} words)
            </span>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff" }}>
            {query}
          </h2>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.9rem",
              background: copied ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${copied ? "#10b981" : "var(--border-color)"}`,
              borderRadius: "8px",
              color: copied ? "#34d399" : "var(--text-primary)",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Copied!" : "Copy MD"}</span>
          </button>

          <button
            onClick={handleDownload}
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
          >
            <Download size={16} />
            <span>Download</span>
          </button>

          <button
            onClick={handlePrint}
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
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Rendered Markdown Content */}
      <article
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />

      {/* Extracted Sources Pill Shelf */}
      {sources.length > 0 && (
        <div style={{
          marginTop: "2.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border-color)",
        }}>
          <h4 style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#93c5fd",
            marginBottom: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}>
            <BookOpen size={16} />
            Verified Citations & External Sources ({sources.length})
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  color: "#93c5fd",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                }}
              >
                <span style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {src.title || src.url}
                </span>
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
