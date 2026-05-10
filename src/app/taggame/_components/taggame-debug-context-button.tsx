"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { createPortal } from "react-dom";
import {
  clearStoredTagGameContextFile,
  readTagGameContextFile,
  type TagGameContextFile,
} from "../_lib/taggame-context-file";

type TagGameDebugContextButtonProps = {
  onContextFileChange?: (contextFile: TagGameContextFile | null) => void;
};

export function TagGameDebugContextButton({
  onContextFileChange,
}: TagGameDebugContextButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [contextFile, setContextFile] = React.useState<TagGameContextFile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    clearStoredTagGameContextFile();
    setContextFile(null);
    onContextFileChange?.(null);
  }, [onContextFileChange]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      setIsLoadingFile(true);
      setError(null);

      try {
        const nextContextFile = await readTagGameContextFile(file);
        setContextFile(nextContextFile);
        saveStoredTagGameContextFile(nextContextFile);
        onContextFileChange?.(nextContextFile);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to read file.");
      } finally {
        setIsLoadingFile(false);
      }
    },
    [onContextFileChange],
  );

  const clearFile = React.useCallback(() => {
    setContextFile(null);
    setError(null);
    clearStoredTagGameContextFile();
    onContextFileChange?.(null);
  }, [onContextFileChange]);

  const overlay = isOpen && isMounted
    ? createPortal(
        <>
          <button
            type="button"
            aria-label="Close debug panel"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] bg-transparent"
          />

          <div className="fixed right-3 top-3 z-[9999] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border border-slate-900/12 bg-white/96 px-2 py-2 shadow-[0_24px_90px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:right-4 sm:top-4">
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
              {isLoadingFile ? "Loading…" : contextFile ? "Replace" : "File"}
            </button>

            {contextFile ? (
              <div className="max-w-[11rem] truncate rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                {contextFile.fileName}
              </div>
            ) : null}

            {contextFile ? (
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

          {error ? (
            <div className="fixed right-3 top-[4.35rem] z-[9999] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-rose-200/80 bg-white/96 px-3 py-2 text-xs font-medium text-rose-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:right-4">
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
            isOpen || contextFile
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
