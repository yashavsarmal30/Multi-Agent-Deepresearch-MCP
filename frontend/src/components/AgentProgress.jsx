import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, CheckCircle2, Circle, Clock, Search, Brain, FileText } from "lucide-react";

export default function AgentProgress({ currentStage, stageMessage }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const steps = [
    {
      id: "searching",
      name: "Web Researcher",
      description: "Decomposing search queries & harvesting live web citations",
      icon: Search,
    },
    {
      id: "analyzing",
      name: "Research Analyst",
      description: "Synthesizing evidence, validating claims & grouping insights",
      icon: Brain,
    },
    {
      id: "writing",
      name: "Technical Writer",
      description: "Authoring executive summary, thematic sections & formatted references",
      icon: FileText,
    },
  ];

  const getStepState = (index) => {
    if (currentStage === "complete") return "done";
    if (currentStage === "writing") {
      if (index < 2) return "done";
      if (index === 2) return "running";
      return "waiting";
    }
    if (currentStage === "analyzing") {
      if (index === 0) return "done";
      if (index === 1) return "running";
      return "waiting";
    }
    if (currentStage === "searching" || currentStage === "planning" || currentStage === "init") {
      if (index === 0) return "running";
      return "waiting";
    }
    return "waiting";
  };

  return (
    <Card className="my-6 border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <CardTitle className="text-sm font-semibold tracking-tight">
            Research Pipeline Active
          </CardTitle>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTime(seconds)}</span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Status log pill */}
        {stageMessage && (
          <div className="mb-4 rounded-lg border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground font-mono text-center sm:text-left flex flex-col sm:flex-row items-center gap-1.5 justify-center sm:justify-start">
            <span className="text-muted-foreground font-sans font-medium">Status:</span>
            <span>{stageMessage}</span>
          </div>
        )}

        {/* 3 Step Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {steps.map((step, idx) => {
            const state = getStepState(idx);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                  state === "running"
                    ? "border-primary/50 bg-primary/5"
                    : state === "done"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-muted/20 text-muted-foreground"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-medium text-xs text-foreground">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{step.name}</span>
                    </div>

                    {state === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {state === "running" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    )}
                    {state === "waiting" && (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Step {idx + 1} of 3</span>
                  <span className="font-medium capitalize">
                    {state === "done" ? "Completed" : state === "running" ? "Running" : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
