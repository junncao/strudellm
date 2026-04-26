"use client";

import { useLoadingContext } from "@/components/loading/context";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface LoadingScreenProps {
  /** Current loading status message */
  status?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Whether loading is complete */
  isComplete?: boolean;
  /** Callback when user clicks to start (after audio context requirements) */
  onStart?: () => void;
}

export function LoadingScreen({ onStart }: LoadingScreenProps) {
  const { isReady, message, progress } = useLoadingContext();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at top, #f2ffe9 0%, #e7f9de 38%, #d9ebd1 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-6 max-w-md px-8">
        {/* Logo / Title */}
        <div className="text-center">
          <h1
            className="mb-1 text-3xl font-black tracking-tight"
            style={{ color: "#3f5749", fontFamily: "Manrope, sans-serif" }}
          >
            MorningDrift
          </h1>
          <p className="text-sm" style={{ color: "rgba(63, 87, 73, 0.72)" }}>
            Live coding with AI assistance
          </p>
        </div>

        {/* Progress Bar */}
        <div
          className="w-full rounded-2xl border px-5 py-4"
          style={{
            background: "rgba(247,255,241,0.72)",
            borderColor: "rgba(149,167,141,0.28)",
            boxShadow: "0 14px 30px rgba(92,95,96,0.07)",
          }}
        >
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(149,167,141,0.18)" }}
          >
            <div
              className={cn(
                "h-full transition-all duration-300",
                !isReady && "animate-pulse",
              )}
              style={{
                width: `${Math.min(progress, 100)}%`,
                background:
                  "linear-gradient(90deg, #f3b43f 0%, #ffd76f 45%, #86c978 100%)",
              }}
            />
          </div>
          <p
            className="mt-3 text-xs text-center font-medium tracking-[0.14em] uppercase"
            style={{ color: "rgba(92,95,96,0.65)" }}
          >
            {message}
          </p>
        </div>

        {/* Start Button (only shown if onStart is provided) */}
        {isReady && onStart && (
          <button
            onClick={onStart}
            className={cn(
              "rounded-full px-6 py-2 text-sm font-semibold transition-colors",
            )}
            style={{
              background:
                "linear-gradient(135deg, #ffe087 0%, #ffd26a 48%, #f3b43f 100%)",
              color: "#2f2410",
            }}
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}
