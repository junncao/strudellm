"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface GenerationIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isGenerating: boolean;
}

export function GenerationIndicator({
  isGenerating,
  className,
  ...props
}: GenerationIndicatorProps) {
  if (!isGenerating) {
    return (
      <div
        className={cn(
          "h-6 min-w-0 flex items-center text-xs text-muted-foreground/80 pl-3",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        "generation-indicator h-6 min-w-0 flex items-center text-xs pl-3",
        className,
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span className="generation-indicator__active shrink-0 inline-flex items-center gap-1.5 font-bold">
        <span className="generation-indicator__dot" aria-hidden />
        <span className="animate-pulse">Generating...</span>
      </span>
    </div>
  );
}
