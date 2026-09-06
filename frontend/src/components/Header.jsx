import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { History, Settings, Sun, Moon, Search, Layers } from "lucide-react";

export default function Header({
  onOpenSettings,
  onOpenHistory,
  config,
  historyCount,
  isDark,
  onToggleTheme,
}) {
  const isLinkUp = config?.default_search_engine === "linkup";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-secondary font-semibold text-foreground">
            <Search className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-foreground sm:text-base">
              Deep Researcher
            </span>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              MCP
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Engine Badge */}
          <div className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{isLinkUp ? "LinkUp Deep Search" : "DuckDuckGo (Free)"}</span>
          </div>

          {/* History Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-medium text-foreground">
                {historyCount}
              </span>
            )}
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
