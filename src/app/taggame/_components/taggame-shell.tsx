"use client";

import { FloatingLoader } from "@/components/loading/floating-loader";
import { cn } from "@/lib/utils";
import { StrudelRepl } from "@/strudel/components/strudel-repl";
import { useStrudel } from "@/strudel/context/strudel-provider";
import { Pause, Play, Square } from "lucide-react";
import * as React from "react";
import { CenterCluster } from "./center-cluster";
import { TagBubbleField } from "./tag-bubble-field";
import { TagGameDebugContextButton } from "./taggame-debug-context-button";
import { TagGameDebugPanel } from "./taggame-debug-panel";
import { TagGameStatus } from "./taggame-status";
import { createTagGameLayout } from "../_lib/taggame-layout";
import { tagGameTags } from "../_lib/taggame-tags";
import { useTagGameController } from "../_lib/use-taggame-controller";

export function TagGameShell() {
  const { isReady, play, stop, isPlaying } = useStrudel();
  const {
    selectedIds,
    selectedTags,
    customTags,
    customInput,
    setCustomInput,
    addCustomTag,
    cookCluster,
    canCook,
    isGenerating,
    generationError,
    playing,
    toggleTag,
    clearSelection,
    summary,
    shouldShowGlobalLoader,
    pendingSummary,
    statusStepLabel,
    setContextFile,
  } = useTagGameController();
  const customInputRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useLayoutEffect(() => {
    const element = customInputRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }, [customInput]);

  const layout = createTagGameLayout([...tagGameTags, ...customTags]);

  return (
    <div className="taggame-shell relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#eef2ff_26%,_#e0f2fe_54%,_#f8fafc_82%,_#ffffff_100%)] text-slate-900">
      {shouldShowGlobalLoader && <FloatingLoader forced message="Waking the music engine…" />}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute right-[-8rem] top-[7rem] h-[22rem] w-[22rem] rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[15%] h-[24rem] w-[24rem] rounded-full bg-emerald-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[96rem] flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-white/45 bg-white/55 px-6 py-5 shadow-[0_18px_80px_rgba(148,163,184,0.12)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">
              TagGame / Music Gene Playground
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Pull bubbles into the core and grow a living loop.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Style bubbles define the macro world. Gene bubbles are finer musical traits like
              skeleton, groove, bass, harmony, timbre, and loop behavior. After building a
              cluster, press Cook to fuse it into Strudel and play it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto lg:justify-end">
            <TagGameDebugContextButton onContextFileChange={setContextFile} />
            <div className="flex items-center gap-2 rounded-full border border-white/55 bg-white/72 px-2 py-2 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  if (isPlaying) {
                    stop();
                    return;
                  }

                  void play();
                }}
                disabled={!isReady}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  !isReady
                    ? "cursor-not-allowed border-slate-200/80 bg-white/55 text-slate-400"
                    : isPlaying
                      ? "border-amber-200/80 bg-amber-50/90 text-amber-950 hover:bg-amber-100"
                      : "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 hover:bg-emerald-100",
                )}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={!isReady || !isPlaying}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  !isReady || !isPlaying
                    ? "cursor-not-allowed border-slate-200/80 bg-white/55 text-slate-400"
                    : "border-slate-200/80 bg-white/85 text-slate-700 hover:bg-white",
                )}
              >
                <Square className="h-3.5 w-3.5" />
                Stop
              </button>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedIds.length === 0}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                selectedIds.length === 0
                  ? "cursor-not-allowed border-slate-200/80 bg-white/55 text-slate-400"
                  : "border-slate-200/80 bg-white/75 text-slate-700 hover:bg-white",
              )}
            >
              Reset cluster
            </button>
            <div className="rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              {selectedIds.length} selected
            </div>
          </div>
        </header>

        <div className="relative mt-6 flex-1">
          <TagBubbleField
            tags={[...tagGameTags, ...customTags]}
            selectedIds={selectedIds}
            onToggle={toggleTag}
            layout={layout}
          >
            <CenterCluster
              tags={selectedTags}
              isGenerating={isGenerating}
              isPlaying={playing}
              canCook={canCook}
              onCook={cookCluster}
            />
          </TagBubbleField>

          <div className="absolute right-6 top-1/2 z-40 w-[19rem] -translate-y-1/2 px-2">
            <div className="rounded-[2rem] border border-white/55 bg-white/68 p-3 shadow-[0_18px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Custom bubble
              </p>
              <div className="mt-3 flex items-end gap-2">
                <textarea
                  ref={customInputRef}
                  rows={1}
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="warm tape drift, glass arp, darker chord pull..."
                  className="min-h-[3rem] min-w-0 flex-1 resize-none overflow-hidden rounded-[1.75rem] border border-pink-200/80 bg-pink-50/80 px-4 py-3 text-sm font-medium leading-6 text-slate-700 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  disabled={customInput.trim().length === 0}
                  className={cn(
                    "rounded-full px-4 py-3 text-sm font-semibold transition",
                    customInput.trim().length === 0
                      ? "cursor-not-allowed border border-slate-200/80 bg-white/65 text-slate-400"
                      : "border border-pink-200/80 bg-gradient-to-br from-pink-300/95 via-rose-200/90 to-white/85 text-rose-950 shadow-[0_12px_30px_rgba(244,114,182,0.22)] hover:from-pink-200 hover:to-white",
                  )}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center px-4">
            <TagGameStatus
              isGenerating={isGenerating}
              isPlaying={playing}
              error={generationError}
              selectionCount={selectedIds.length}
              summary={pendingSummary || summary}
              stepLabel={statusStepLabel}
            />
          </div>

          {selectedTags.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center px-4">
              <div className="flex max-w-[44rem] flex-wrap items-center justify-center gap-2 rounded-[1.75rem] border border-white/45 bg-white/68 px-4 py-3 shadow-[0_12px_45px_rgba(15,23,42,0.08)] backdrop-blur-md">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <TagGameDebugPanel />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 overflow-hidden opacity-0">
        <div className="pointer-events-auto h-[1px] w-[1px] overflow-hidden">
          {isReady && <StrudelRepl />}
        </div>
      </div>
    </div>
  );
}
