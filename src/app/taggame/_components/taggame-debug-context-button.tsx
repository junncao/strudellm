"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { createPortal } from "react-dom";
import {
  clearStoredTagGameContextSource,
  loadStoredTagGameContextSource,
  readTagGameContextFile,
  saveStoredTagGameContextSource,
  type TagGameContextSource,
} from "../_lib/taggame-context-file";

type TagGameDebugContextButtonProps = {
  onContextSourceChange?: (contextSource: TagGameContextSource | null) => void;
};

const PATH_MODE_ENABLED = process.env.NODE_ENV !== "production";

export function TagGameDebugContextButton({
  onContextSourceChange,
}: TagGameDebugContextButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [contextSource, setContextSource] = React.useState<TagGameContextSource | null>(null);
  const [pathInput, setPathInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    const storedSource = loadStoredTagGameContextSource();
    setContextSource(storedSource);
    setPathInput(storedSource?.kind === "path" ? storedSource.path : "");
    onContextSourceChange?.(storedSource);
  }, [onContextSourceChange]);

  const applyContextSource = React.useCallback(
    (nextContextSource: TagGameContextSource | null) => {
      setContextSource(nextContextSource);
      setPathInput(nextContextSource?.kind === "path" ? nextContextSource.path : "");
      setError(null);

      if (nextContextSource) {
        saveStoredTagGameContextSource(nextContextSource);
      } else {
        clearStoredTagGameContextSource();
      }

      onContextSourceChange?.(nextContextSource);
    },
    [onContextSourceChange],
  );

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setIsLoadingFile(true);
      setError(null);

      try {
        const nextContextFile = await readTagGameContextFile(file);
        applyContextSource({ kind: "upload", file: nextContextFile });
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to read file.");
      } finally {
        setIsLoadingFile(false);
      }
    },
    [applyContextSource],
  );

  const handlePathSave = React.useCallback(() => {
    const nextPath = pathInput.trim();
    if (!nextPath) {
      setError("Enter a local file path first.");
      return;
    }

    applyContextSource({ kind: "path", path: nextPath });
  }, [applyContextSource, pathInput]);

  const clearFile = React.useCallback(() => {
    applyContextSource(null);
  }, [applyContextSource]);

  const sourceLabel = contextSource?.kind === "upload"
    ? contextSource.file.fileName
    : contextSource?.kind === "path"
      ? contextSource.path
      : null;

  const overlay = isOpen && isMounted
    ? createPortal(
        <>
          <button
            type="button"
            aria-label="Close debug panel"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] bg-transparent"
          />

          <div className="fixed right-3 top-3 z-[9999] flex max-w-[calc(100vw-1.5rem)] flex-col gap-2 rounded-[1.5rem] border border-slate-900/12 bg-white/96 p-3 shadow-[0_24px_90px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:right-4 sm:top-4 sm:min-w-[25rem]">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.csv,.yaml,.yml,text/plain,text/markdown,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isLoadingFile}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  isLoadingFile
                    ? "cursor-wait border-slate-200/80 bg-white/60 text-slate-400"
                    : "border-sky-200/80 bg-sky-50/90 text-sky-900 hover:bg-sky-100",
                )}
              >
                {isLoadingFile ? "Loading…" : contextSource?.kind === "upload" ? "Replace file" : "File"}
              </button>

              {contextSource ? (
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-full border border-rose-200/80 bg-rose-50/90 px-3 py-1.5 text-xs font-semibold text-rose-900 transition hover:bg-rose-100"
                >
                  Clear
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white"
              >
                Close
              </button>
            </div>

            {PATH_MODE_ENABLED ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Local path
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={pathInput}
                    onChange={(event) => setPathInput(event.target.value)}
                    placeholder="/Users/you/project/context.md"
                    className="min-w-0 flex-1 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handlePathSave}
                    className="rounded-full border border-violet-200/80 bg-violet-50/90 px-3 py-2 text-xs font-semibold text-violet-900 transition hover:bg-violet-100"
                  >
                    Use path
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  Path mode only works when this app is running locally. The file is read when you press Cook.
                </p>
              </div>
            ) : null}

            {contextSource ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-900">
                <span className="rounded-full bg-white/80 px-2 py-0.5 uppercase tracking-[0.18em] text-[10px] text-emerald-700">
                  {contextSource.kind}
                </span>
                <span className="min-w-0 flex-1 truncate">{sourceLabel}</span>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="fixed right-3 top-[15.5rem] z-[9999] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-rose-200/80 bg-white/96 px-3 py-2 text-xs font-medium text-rose-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:right-4 sm:w-[25rem]">
              {error}
            </div>
          ) : null}
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <div className="relative z-[150]">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            isOpen || contextSource
              ? "border-slate-900/15 bg-slate-900 text-white shadow-[0_12px_35px_rgba(15,23,42,0.22)]"
              : "border-slate-200/80 bg-white/75 text-slate-700 hover:bg-white",
          )}
        >
          Debug
        </button>
      </div>

      {overlay}
    </>
  );
}
