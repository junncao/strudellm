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
          /* Code view */
          <div className="h-full p-4 overflow-auto">
            <pre
              className="text-[11px] font-mono leading-relaxed break-words whitespace-pre-wrap"
              style={{ color: "#444841bb" }}
            >
              {track.code.trim()}
            </pre>
          </div>
        ) : (
          /* Waveform view */
          <Waveform playing={trackIsPlaying} accent={accent} />
        )}
      </div>
    </div>
  );
}
