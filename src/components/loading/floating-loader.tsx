"use client";

import * as React from "react";
import { useLoadingContext } from "@/components/loading/context";
import { cn } from "@/lib/utils";

type Mode = "overlay" | "page";

/**
 * Non-blocking floating loader chip. Two modes:
 *
 * - "overlay" (default): renders as a small pill at the top of the viewport,
 *   pointer-events disabled on the wrapper so the chat page stays interactive.
 *   Used for re-init / tab-refocus / streaming states where we want to show
 *   the user "something's happening" without ever hiding the app.
 *
 * - "page": full-viewport translucent sage backdrop with the same chip
 *   centered. Used only for the outer auth-pending gate where TamboProvider
 *   isn't mounted yet and we genuinely have nothing else to render.
 *
 * Design: capsule, backdrop-blur, three pulsing dots, optional status text.
 * Auto-hides itself when the loading context reports `isReady` and we're not
 * in `forced` mode.
 */
export function FloatingLoader({
  mode = "overlay",
  forced = false,
  message: messageOverride,
}: {
  mode?: Mode;
  forced?: boolean;
  message?: string;
}) {
  const { isReady, message: ctxMessage } = useLoadingContext();
  const message = messageOverride ?? ctxMessage;

  // Don't render at all when ready unless explicitly forced (e.g. caller
  // controls visibility based on its own state).
  if (!forced && isReady) return null;

  if (mode === "page") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at top, #f2ffe9 0%, #e7f9de 38%, #d9ebd1 100%)",
        }}
      >
        <Chip message={message} />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center"
      aria-live="polite"
      aria-atomic
    >
      <Chip message={message} compact />
    </div>
  );
}

function Chip({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto inline-flex items-center gap-2.5 rounded-full",
        "border border-[rgba(149,167,141,0.32)] backdrop-blur-md",
        "shadow-[0_8px_24px_rgba(63,87,73,0.12),0_2px_6px_rgba(63,87,73,0.08)]",
        "transition-all duration-200",
        compact ? "px-3.5 py-2" : "px-5 py-2.5",
      )}
      style={{
        background: "rgba(247, 255, 241, 0.86)",
        color: "#3f5749",
        fontFamily: "Manrope, sans-serif",
      }}
      role="status"
    >
      <Dots />
      <span
        className={cn(
          "font-bold uppercase tracking-[0.16em]",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {message}
      </span>
    </div>
  );
}

function Dots() {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      <span
        className="block h-1.5 w-1.5 rounded-full"
        style={{
          background: "#f3b43f",
          animation: "morningdrift-loader-dot 1.1s ease-in-out infinite",
          animationDelay: "0s",
        }}
      />
      <span
        className="block h-1.5 w-1.5 rounded-full"
        style={{
          background: "#86c978",
          animation: "morningdrift-loader-dot 1.1s ease-in-out infinite",
          animationDelay: "0.18s",
        }}
      />
      <span
        className="block h-1.5 w-1.5 rounded-full"
        style={{
          background: "#1d4e89",
          animation: "morningdrift-loader-dot 1.1s ease-in-out infinite",
          animationDelay: "0.36s",
        }}
      />
    </span>
  );
}
