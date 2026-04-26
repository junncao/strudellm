"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { VolumeFader } from "./volume-fader";
import { useTracks } from "@/strudel/context/track-context";
import { useStrudel } from "@/strudel/context/strudel-provider";
import type { Track } from "@/strudel/lib/track-parser";

// ── Instrument accent colours ──────────────────────────────────────────────
const INSTRUMENT_COLORS: Record<string, string> = {
  kick: "#894c5a",  bd: "#894c5a",  drum: "#894c5a",  perc: "#894c5a",
  snare: "#735c00", sd: "#735c00",
  hat: "#5c5f60",   hh: "#5c5f60",  oh: "#5c5f60",
  bass: "#2d6a4f",
  pad: "#1d4e89",
  lead: "#6b2fa0",  synth: "#6b2fa0",  arp: "#1d4e89",
  piano: "#2d6a4f", keys: "#1d4e89",  chord: "#1d4e89",
  guitar: "#854d0e", gtr: "#854d0e",
};

function getAccent(name: string): string {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(INSTRUMENT_COLORS)) {
    if (lower.includes(k)) return v;
  }
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) & 0xffff;
  return `hsl(${h % 280}, 45%, 38%)`;
}

// ── Waveform bars (fake, for visual only) ─────────────────────────────────
const BAR_HEIGHTS = [
  0.45, 0.70, 0.55, 0.90, 0.60, 0.80, 0.40, 0.75,
  0.55, 0.85, 0.60, 0.45, 0.90, 0.65, 0.50, 0.75,
  0.30, 0.80, 0.55, 0.70, 0.40, 0.65, 0.85, 0.50,
];

function Waveform({ playing, accent }: { playing: boolean; accent: string }) {
  return (
    <div className="absolute inset-0 flex items-end justify-around px-5 pb-5 pointer-events-none">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={cn("rounded-full", playing && "waveform-bar-active")}
          style={{
            width: 3,
            height: `${(playing ? h : h * 0.28) * 100}%`,
            background: accent,
            opacity: playing ? 0.55 : 0.18,
            // staggered delay so bars don't all move together
            animationDelay: `${i * 45}ms`,
            transition: playing ? undefined : "height 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Debounce hook ──────────────────────────────────────────────────────────
function useDebounced(value: number, delay: number): number {
  const [d, setD] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

// ── TrackCard ──────────────────────────────────────────────────────────────
type Props = {
  track: Track;
  anySoloed: boolean;
};

// Debounce window between the last keystroke and an automatic apply (recompile
// + hot-evaluate). Short enough to feel "live", long enough that continuous
// typing doesn't churn the audio scheduler or spam syntax errors mid-token.
const TRACK_EDIT_APPLY_DEBOUNCE_MS = 400;

function TrackCodePanel({ track }: { track: Track }) {
  const { updateTrackCode } = useTracks();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<any>(null);
  const isFocusedRef = React.useRef(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so the (mount-once) editor onChange callback always sees the
  // current track id and the latest updateTrackCode reference.
  const trackIdRef = React.useRef(track.id);
  const updateTrackCodeRef = React.useRef(updateTrackCode);
  React.useEffect(() => {
    trackIdRef.current = track.id;
  }, [track.id]);
  React.useEffect(() => {
    updateTrackCodeRef.current = updateTrackCode;
  }, [updateTrackCode]);

  const clearDebounce = React.useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
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
        initialCode: track.code,
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
            // Persist draft immediately (no recompile) — guarantees that
            // toggling the panel away or reloading after an apply doesn't
            // lose the latest typed character.
            updateTrackCodeRef.current(trackIdRef.current, nextCode, false);
            // Debounce the actual apply so continuous typing doesn't
            // re-evaluate Strudel on every keystroke.
            clearDebounce();
            debounceRef.current = setTimeout(() => {
              debounceRef.current = null;
              updateTrackCodeRef.current(trackIdRef.current, nextCode, true);
            }, TRACK_EDIT_APPLY_DEBOUNCE_MS);
          }
          if (update.focusChanged && !update.view.hasFocus) {
            // Blur — flush any pending debounce so the edit takes effect now.
            clearDebounce();
            updateTrackCodeRef.current(
              trackIdRef.current,
              update.state.doc.toString(),
              true,
            );
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
      // Flush any pending debounce on unmount so toggling the panel never
      // loses an in-progress edit.
      const editor = editorRef.current;
      if (debounceRef.current && editor?.state?.doc) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        updateTrackCodeRef.current(
          trackIdRef.current,
          editor.state.doc.toString(),
          true,
        );
      }
      editor?.destroy?.();
      editorRef.current = null;
    };
  }, [clearDebounce]);

  // Sync external code changes (e.g. AI updateRepl) into the editor — but
  // only when the user isn't actively editing, otherwise we'd clobber the
  // cursor mid-typing.
  React.useEffect(() => {
    if (isFocusedRef.current) return;
    const editor = editorRef.current;
    if (!editor?.dispatch || !editor.state?.doc) return;
    const nextCode = track.code;
    const currentCode = editor.state.doc.toString();
    if (currentCode === nextCode) return;
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: nextCode,
      },
    });
  }, [track.code]);

  return (
    <div className="track-code-panel flex h-full flex-col overflow-hidden rounded-[0.95rem] border border-[#d3dfcc] bg-[#f2faec]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#d3dfcc] bg-[#edf8e6] px-3 py-1.5">
        <span className="inline-flex h-2 w-2 rounded-full bg-[#f3b43f]" />
        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#6d7368]">
          Live Coding
        </span>
      </div>
      <div
        ref={rootRef}
        className="track-code-editor min-h-0 flex-1 overflow-hidden"
      />
    </div>
  );
}

export function TrackCard({ track, anySoloed }: Props) {
  const { setMute, setSolo, setVolume } = useTracks();
  const { isPlaying } = useStrudel();
  const accent = getAccent(track.name);

  // Eye toggle: open = show code, closed = show waveform
  const [showCode, setShowCode] = React.useState(false);

  // Local volume for immediate slider feedback, debounced audio update
  const [localVol, setLocalVol] = React.useState(track.volume);
  const debouncedVol = useDebounced(localVol, 160);

  React.useEffect(() => { setLocalVol(track.volume); }, [track.volume]);
  React.useEffect(() => {
    if (debouncedVol !== track.volume) setVolume(track.id, debouncedVol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedVol]);

  const effectivelySilenced = track.muted || (anySoloed && !track.soloed);
  const trackIsPlaying = isPlaying && !effectivelySilenced;

  return (
    <div
      className={cn(
        "flex gap-1 overflow-hidden rounded-2xl transition-opacity duration-200 p-1",
        effectivelySilenced && "opacity-40"
      )}
      style={{ background: "#e7f9de", minHeight: "11rem" }}
    >
      {/* ── Left: Controls ── */}
      <div
        className="w-72 shrink-0 rounded-xl p-5 flex flex-col justify-between"
        style={{ background: "#d6e8ce" }}
      >
        {/* Name row + eye button */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {/* LED dot */}
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300",
                  trackIsPlaying && "animate-pulse"
                )}
                style={{
                  background: accent,
                  boxShadow: trackIsPlaying ? `0 0 8px ${accent}88` : "none",
                }}
              />
              <span
                className="text-xs font-black uppercase tracking-widest truncate text-[#111f0f]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {track.name}
              </span>
            </div>

            {/* Eye toggle button */}
            <button
              onClick={() => setShowCode((v) => !v)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_10px_#ffe087] ml-2"
              style={{
                background: showCode ? "#894c5a" : "rgba(255,255,255,0.7)",
                color: showCode ? "white" : "#5c5f60",
                boxShadow: showCode ? "0 0 10px #894c5a44" : undefined,
              }}
              title={showCode ? "Hide code" : "Show code"}
            >
              {showCode
                ? <Eye className="w-3.5 h-3.5" />
                : <EyeOff className="w-3.5 h-3.5" />
              }
            </button>
          </div>

          {/* SOLO / MUTE */}
          <div className="flex gap-2">
            <button
              onClick={() => setSolo(track.id)}
              className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all select-none"
              style={{
                background: track.soloed ? "#ffd9df" : "rgba(255,255,255,0.65)",
                color: track.soloed ? "#6d3543" : "#5c5f60",
                boxShadow: track.soloed ? "0 0 10px #ffd9df" : undefined,
              }}
            >
              SOLO
            </button>
            <button
              onClick={() => setMute(track.id, !track.muted)}
              className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all select-none"
              style={{
                background: track.muted ? "#ffdad6" : "rgba(255,255,255,0.65)",
                color: track.muted ? "#93000a" : "#5c5f60",
                boxShadow: track.muted ? "0 0 10px #ffdad680" : undefined,
              }}
            >
              MUTE
            </button>
          </div>
        </div>

        {/* Volume fader */}
        <VolumeFader
          value={localVol}
          onChange={setLocalVol}
          disabled={effectivelySilenced}
        />
      </div>

      {/* ── Right: Waveform or Code ── */}
      <div
        className="flex-1 rounded-xl relative overflow-hidden transition-colors duration-300"
        style={{
          background: showCode
            ? "rgba(214,232,206,0.8)"   // sage — code view
            : "rgba(255,255,255,0.35)", // translucent white — waveform view
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        {showCode ? (
          /* Code view — fills the right pane edge-to-edge */
          <TrackCodePanel track={track} />
        ) : (
          /* Waveform view */
          <Waveform playing={trackIsPlaying} accent={accent} />
        )}
      </div>
    </div>
  );
}
