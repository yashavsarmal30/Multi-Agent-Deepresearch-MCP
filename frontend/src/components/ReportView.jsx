import React, { useMemo, useState } from "react";
import { marked } from "marked";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Copy, Download, Printer, Check, ExternalLink, BookOpen, Clock, FileText } from "lucide-react";

export default function ReportView({ result }) {
  const [copied, setCopied] = useState(false);

  const reportText = result?.report || "";
  const query = result?.query || "Research Synthesis";

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
        let hostname = "";
        try {
          hostname = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          hostname = "link";
        }
        matches.push({ title, url, hostname });
      }
    }
    return matches;
  }, [reportText]);

  // Word count and reading time
  const stats = useMemo(() => {
    const words = reportText.trim().split(/\s+/).filter(Boolean).length;
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
    <div className="w-full my-6 space-y-6">
      {/* Top Document Card */}
      <Card className="border bg-card shadow-sm">
        {/* Document Action Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b p-4 sm:px-6 text-center sm:text-left">
          <div className="space-y-1 flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px] font-medium">
                Research Report
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {stats.readMinutes} min read ({stats.words} words)
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {query}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Download .md</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs font-medium hidden sm:inline-flex"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* Markdown Content */}
        <CardContent className="p-6 sm:p-8">
          <article
            className="prose prose-zinc dark:prose-invert max-w-none text-foreground text-sm sm:text-base leading-relaxed
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h1:text-xl sm:prose-h1:text-2xl prose-h1:border-b prose-h1:pb-2 prose-h1:mt-6 prose-h1:mb-4
              prose-h2:text-lg sm:prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-3
              prose-h3:text-base sm:prose-h3:text-lg
              prose-p:my-3 prose-p:leading-relaxed
              prose-ul:my-2 prose-li:my-1
              prose-table:w-full prose-table:border-collapse prose-table:my-4
              prose-th:border prose-th:border-border prose-th:bg-muted/40 prose-th:p-2.5 prose-th:text-xs prose-th:font-semibold
              prose-td:border prose-td:border-border prose-td:p-2.5 prose-td:text-xs
              prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r prose-blockquote:italic
              prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-pre:p-4"
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />
        </CardContent>
      </Card>

      {/* Sources Grid Card */}
      {sources.length > 0 && (
        <Card className="border bg-card shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              References & Verified Sources ({sources.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-lg border bg-muted/20 p-2.5 transition-all hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {src.title || src.hostname}
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                </div>
                <span className="mt-1 text-[11px] text-muted-foreground truncate">
                  {src.hostname}
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
