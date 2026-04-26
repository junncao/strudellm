"use client";

import * as React from "react";
import { useTracks } from "@/strudel/context/track-context";
import { parseTempo, type Tempo } from "@/strudel/lib/tempo";

const BPM_MIN = 30;
const BPM_MAX = 320;
const BEATS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 12];

/**
 * Compact transport-style tempo display + editor for the DAW header.
 * Shows BPM (editable inline) and beats-per-cycle (small dropdown), wired
 * to the preamble's `setCpm(BPM/beats)` line via the track context.
 */
export function TempoControl() {
  const { dawState, setTempo } = useTracks();
  const tempo = React.useMemo(
    () => parseTempo(dawState.preamble || dawState.rawCode),
    [dawState.preamble, dawState.rawCode],
  );

  const [bpmDraft, setBpmDraft] = React.useState(String(tempo.bpm));
  const [editing, setEditing] = React.useState(false);

  // Reflect external tempo changes into the input when the user isn't editing.
  React.useEffect(() => {
    if (!editing) setBpmDraft(String(tempo.bpm));
  }, [tempo.bpm, editing]);

  const commitBpm = (raw: string) => {
    setEditing(false);
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setBpmDraft(String(tempo.bpm));
      return;
    }
    const clamped = Math.min(BPM_MAX, Math.max(BPM_MIN, parsed));
    setBpmDraft(String(clamped));
    if (clamped !== tempo.bpm) {
      setTempo({ bpm: clamped, beatsPerCycle: tempo.beatsPerCycle });
    }
  };

  const setBeats = (beats: number) => {
    if (beats === tempo.beatsPerCycle) return;
    setTempo({ bpm: tempo.bpm, beatsPerCycle: beats });
  };

  const nudgeBpm = (delta: number) => {
    const next: Tempo = {
      bpm: Math.min(BPM_MAX, Math.max(BPM_MIN, tempo.bpm + delta)),
      beatsPerCycle: tempo.beatsPerCycle,
    };
    setTempo(next);
  };

  return (
    <div
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        fontFamily: "Manrope, sans-serif",
      }}
      title="Project tempo — BPM / beats per cycle"
    >
      {/* Quarter-note glyph */}
      <span
        className="text-[#5c5f60] text-[15px] leading-none select-none"
        aria-hidden
      >
        ♩
      </span>

      <input
        type="number"
        inputMode="numeric"
        value={bpmDraft}
        min={BPM_MIN}
        max={BPM_MAX}
        onFocus={() => setEditing(true)}
        onChange={(e) => setBpmDraft(e.target.value)}
        onBlur={(e) => commitBpm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.currentTarget as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setBpmDraft(String(tempo.bpm));
            setEditing(false);
            (e.currentTarget as HTMLInputElement).blur();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            nudgeBpm(e.shiftKey ? 5 : 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            nudgeBpm(e.shiftKey ? -5 : -1);
          }
        }}
        className="tempo-control__input w-12 bg-transparent text-center font-bold text-sm text-[#2f2410] outline-none tabular-nums"
        aria-label="Beats per minute"
      />

      <span
        className="text-[10px] font-black uppercase tracking-widest text-[#5c5f60]"
        aria-hidden
      >
        BPM
      </span>

      <span className="text-[#5c5f60]/50 mx-0.5">/</span>

      <select
        value={tempo.beatsPerCycle}
        onChange={(e) => setBeats(parseInt(e.target.value, 10))}
        className="bg-transparent text-sm font-bold text-[#2f2410] outline-none cursor-pointer tabular-nums"
        aria-label="Beats per cycle"
        title="Beats per cycle"
      >
        {BEATS_OPTIONS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}
