"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useTracks } from "@/strudel/context/track-context";

type Props = {
  onClose: () => void;
};

// Same debounce window as the per-track editors so live-typing in the full
// dialog feels consistent with editing a single track.
const FULL_CODE_APPLY_DEBOUNCE_MS = 400;

export function FullCodeDialog({ onClose }: Props) {
  const { dawState, setRawCode } = useTracks();
  const code = dawState.rawCode;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<any>(null);
  const isFocusedRef = React.useRef(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track what we last pushed to the service so close-time commit doesn't
  // re-apply identical code.
  const lastAppliedRef = React.useRef(code);

  const setRawCodeRef = React.useRef(setRawCode);
  React.useEffect(() => {
    setRawCodeRef.current = setRawCode;
  }, [setRawCode]);

  const clearDebounce = React.useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const commit = React.useCallback(
    (next: string) => {
      if (next === lastAppliedRef.current) return;
      lastAppliedRef.current = next;
      setRawCodeRef.current(next);
    },
    [],
  );

  const handleClose = React.useCallback(() => {
    clearDebounce();
    const editor = editorRef.current;
    if (editor?.state?.doc) {
      commit(editor.state.doc.toString());
    }
    onClose();
  }, [clearDebounce, commit, onClose]);

  const handleCloseRef = React.useRef(handleClose);
  React.useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    let disposed = false;

    const mountEditor = async () => {
      if (!rootRef.current || editorRef.current) return;

      const [{ initEditor }, { applyLightSyntaxTheme }] = await Promise.all([
        import("@strudel/codemirror"),
        import("@/strudel/lib/light-syntax-theme"),
      ]);
      if (disposed || !rootRef.current) return;

      const editor = initEditor({
        root: rootRef.current,
        initialCode: code,
        onChange: (update: {
          docChanged: boolean;
          focusChanged: boolean;
          view: { hasFocus: boolean };
          state: { doc: { toString(): string } };
        }) => {
          if (update.focusChanged) {
            isFocusedRef.current = update.view.hasFocus;
          }
          if (update.docChanged) {
            const nextCode = update.state.doc.toString();
            clearDebounce();
            debounceRef.current = setTimeout(() => {
              debounceRef.current = null;
              commit(nextCode);
            }, FULL_CODE_APPLY_DEBOUNCE_MS);
          }
          if (update.focusChanged && !update.view.hasFocus) {
            clearDebounce();
            commit(update.state.doc.toString());
          }
        },
      });

      applyLightSyntaxTheme(editor);

      rootRef.current.style.fontSize = "14px";
      const scroller = rootRef.current.querySelector(".cm-scroller") as HTMLElement | null;
      if (scroller) {
        scroller.style.fontFamily =
          "var(--font-jetbrains-mono), var(--font-fira-code), monospace";
      }

      editorRef.current = editor;
    };

    mountEditor();

    return () => {
      disposed = true;
      // Final flush on unmount in case the user closed via outside-click
      // before the debounce fired.
      const editor = editorRef.current;
      if (debounceRef.current && editor?.state?.doc) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        commit(editor.state.doc.toString());
      }
      editor?.destroy?.();
      editorRef.current = null;
    };
  }, [clearDebounce, commit]);

  // Sync upstream code → editor only when not focused, so AI updates land
  // without clobbering an in-progress edit.
  React.useEffect(() => {
    if (isFocusedRef.current) return;
    const editor = editorRef.current;
    if (!editor?.dispatch || !editor.state?.doc) return;
    const currentCode = editor.state.doc.toString();
    if (currentCode === code) return;
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: code,
      },
    });
    lastAppliedRef.current = code;
  }, [code]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-[#e7f9de] rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d3dfcc]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#f3b43f]" />
            <h2
              className="text-sm font-black uppercase tracking-widest text-[#5c5f60]"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Full Code
            </h2>
            <span
              className="text-[10px] font-bold uppercase tracking-widest text-[#5c5f60]/60 ml-2"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Edits auto-save
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 hover:bg-white/90 transition-all text-[#5c5f60]"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden">
          <div className="h-full overflow-hidden rounded-[0.95rem] border border-[#d3dfcc] bg-[#f2faec]">
            <div className="flex items-center gap-2 border-b border-[#d3dfcc] bg-[#edf8e6] px-3 py-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#f3b43f]" />
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#6d7368]">
                Live Coding
              </span>
            </div>
            <div
              ref={rootRef}
              className="track-code-editor h-[calc(100%-2.25rem)] overflow-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
