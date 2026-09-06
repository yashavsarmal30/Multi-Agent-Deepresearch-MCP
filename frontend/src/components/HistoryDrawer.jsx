import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Trash2, Calendar, FileText } from "lucide-react";

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectReport,
  onDeleteReport,
}) {
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
    return filename
      .replace(/^\d{8}_\d{6}_/, "")
      .replace(/\.md$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="flex flex-col p-6 w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <SheetTitle className="text-base font-semibold">
              Research History ({history.length})
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Previously archived research reports saved to disk.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No saved reports found.</p>
              <p className="mt-1 text-[11px]">Run a research query to archive reports.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.filename}
                className="group flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div
                  onClick={() => {
                    onSelectReport(item.filename);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer pr-2 overflow-hidden"
                >
                  <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {formatTitle(item.filename)}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.created_at)}
                    </span>
                    <span>•</span>
                    <span>{Math.round(item.size_bytes / 1024)} KB</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteReport(item.filename)}
                  className="h-7 w-7 text-muted-foreground opacity-60 hover:opacity-100 hover:text-destructive"
                  title="Delete report"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
