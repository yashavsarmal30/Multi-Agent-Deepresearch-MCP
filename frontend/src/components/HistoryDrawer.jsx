import React from "react";
import { X, FileText, Trash2, Calendar, ExternalLink } from "lucide-react";

export default function HistoryDrawer({ isOpen, onClose, history, onSelectReport, onDeleteReport }) {
  if (!isOpen) return null;

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const formatTitle = (filename) => {
    // Remove date prefix and .md extension: 20260306_120000_topic_name.md -> Topic Name
    return filename
      .replace(/^\d{8}_\d{6}_/, "")
      .replace(/\.md$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      maxWidth: "420px",
      background: "#0d1322",
      borderLeft: "1px solid var(--border-color)",
      zIndex: 100,
      boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.6)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={18} color="#60a5fa" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
            Research History ({history.length})
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

      {/* Reports List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
        {history.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "var(--text-muted)",
          }}>
            <FileText size={36} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
            <p style={{ fontSize: "0.95rem" }}>No research reports saved yet.</p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Run a research query to generate and archive reports.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {history.map((item) => (
              <div
                key={item.filename}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
              >
                <div
                  onClick={() => {
                    onSelectReport(item.filename);
                    onClose();
                  }}
                  style={{ flex: 1, cursor: "pointer" }}
                >
                  <h4 style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#f1f5f9",
                    marginBottom: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {formatTitle(item.filename)}
                  </h4>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}>
                    <Calendar size={12} />
                    <span>{formatDate(item.created_at)}</span>
                    <span>•</span>
                    <span>{Math.round(item.size_bytes / 1024)} KB</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteReport(item.filename)}
                  title="Delete report"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "6px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
