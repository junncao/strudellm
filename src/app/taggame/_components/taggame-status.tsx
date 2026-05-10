import { cn } from "@/lib/utils";

export function TagGameStatus({
  isGenerating,
  isPlaying,
  error,
  selectionCount,
  summary,
  stepLabel,
}: {
  isGenerating: boolean;
  isPlaying: boolean;
  error: string | null;
  selectionCount: number;
  summary: string;
  stepLabel: string;
}) {
  const tone = error
    ? "border-rose-300/45 bg-rose-100/80 text-rose-900"
    : isGenerating
      ? "border-sky-300/45 bg-sky-100/80 text-sky-900"
      : isPlaying
        ? "border-emerald-300/45 bg-emerald-100/80 text-emerald-900"
        : "border-white/35 bg-white/75 text-slate-800";

  const label = error
    ? "Generation hit a snag"
    : isGenerating
      ? "Cooking the selected cluster"
      : isPlaying
        ? "Now playing"
        : selectionCount > 0
          ? "Ready to cook"
          : "Choose bubbles to start";

  const detail = error
    ? error
    : selectionCount > 0
      ? summary
      : "Mix style bubbles with fine-grained music genes like kick skeleton, swing, sub bass, chord color, and timbre.";

  return (
    <div
      className={cn(
        "inline-flex max-w-[44rem] items-center gap-3 rounded-full border px-4 py-2 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-md",
        tone,
      )}
    >
      <div className="flex items-center gap-1.5" aria-hidden>
        <span
          className={cn(
            "block h-2.5 w-2.5 rounded-full",
            error
              ? "bg-rose-500"
              : isGenerating
                ? "bg-sky-500 animate-pulse"
                : isPlaying
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-400",
          )}
        />
        {isGenerating && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-[morningdrift-loader-dot_1.1s_ease-in-out_infinite]" />
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-[morningdrift-loader-dot_1.1s_ease-in-out_infinite] [animation-delay:0.18s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-[morningdrift-loader-dot_1.1s_ease-in-out_infinite] [animation-delay:0.36s]" />
          </>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">
          {label}
        </p>
        <p className="text-[11px] font-semibold text-slate-600/80">{stepLabel}</p>
        <p className="truncate text-sm font-medium">{detail}</p>
      </div>
    </div>
  );
}
