"use client";

import { cn } from "@/lib/utils";
import {
  clearTagGameDebugLogs,
  isTagGameDebugEnabled,
  useTagGameDebugLogs,
} from "../_lib/taggame-debug";

const levelClasses = {
  info: "border-sky-200/70 bg-sky-50/75 text-sky-900",
  success: "border-emerald-200/70 bg-emerald-50/75 text-emerald-900",
  warn: "border-amber-200/70 bg-amber-50/80 text-amber-950",
  error: "border-rose-200/70 bg-rose-50/80 text-rose-950",
} as const;

function formatTime(at: number) {
  return new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TagGameDebugPanel() {
  const logs = useTagGameDebugLogs();

  if (!isTagGameDebugEnabled()) {
    return null;
  }

  return (
    <div className="absolute bottom-5 left-5 z-[90] w-[23rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-white/82 shadow-[0_18px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-900/8 px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">
            TagGame debug
          </p>
          <p className="mt-1 text-xs text-slate-500">Localhost only, latest lifecycle steps and errors.</p>
        </div>
        <button
          type="button"
          onClick={clearTagGameDebugLogs}
          className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white"
        >
          Clear
        </button>
      </div>

      <div className="max-h-[18rem] space-y-2 overflow-y-auto px-3 py-3">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/80 px-3 py-4 text-sm text-slate-500">
            No logs yet.
          </div>
        ) : (
          [...logs].reverse().map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "rounded-2xl border px-3 py-2 shadow-sm",
                levelClasses[entry.level],
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">
                    {entry.step}
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-5">{entry.message}</div>
                </div>
                <div className="shrink-0 text-[10px] font-medium opacity-60">{formatTime(entry.at)}</div>
              </div>
              {entry.detail ? (
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-white/55 px-2 py-2 text-[11px] leading-5 text-slate-700">
                  {entry.detail}
                </pre>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
