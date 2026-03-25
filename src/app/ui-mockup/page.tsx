"use client";

import { Play, Square, Volume2, Sliders, Bot, Send, ChevronDown, Code, LayoutGrid } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const OCTAVES = [1, 2, 3, 4, 5, 6] as const;
const SCALE_TYPES = ["minor", "major", "dorian", "phrygian", "mixolydian", "lydian", "pentatonic", "blues", "chromatic"] as const;
const SYNTH_SOUNDS = ["supersaw", "sawtooth", "square", "triangle", "sine", "piano", "organ"] as const;
const DRUM_BANKS = ["RolandTR808", "RolandTR909", "RolandCR78", "AcousticKit", "LoFi"] as const;

// ─── Types ──────────────────────────────────────────────────────────────

type ScaleConfig = { root: string; octave: number; type: string };
type ChordStep = { notes: string[]; label: string };

type Track = {
  id: string;
  label: string;
  type: "synth" | "drum" | "pad";
  color: string;
  gain: number;
  muted: boolean;
  solo: boolean;
  playing: boolean;
  sound: string;
  // Synth-specific
  scale?: ScaleConfig;
  notePattern?: number[];
  // Pad-specific
  chords?: ChordStep[];
  // Drum-specific
  drumPattern?: string;
  bank?: string;
  params: Record<string, { value: number; min: number; max: number; step: number }>;
  scopeData: number[];
};

const INITIAL_TRACKS: Track[] = [
  {
    id: "arp",
    label: "$arp",
    type: "synth",
    color: "var(--color-primary)",
    gain: 0.49,
    muted: false,
    solo: false,
    playing: true,
    sound: "supersaw",
    scale: { root: "E", octave: 3, type: "minor" },
    notePattern: [0, 4, 7, 11, 12, 11, 7, 4],
    params: {
      gain: { value: 0.49, min: 0, max: 1, step: 0.01 },
      lpf: { value: 950, min: 300, max: 1600, step: 10 },
      detune: { value: 0.6, min: 0, max: 1, step: 0.01 },
      attack: { value: 0.02, min: 0, max: 0.5, step: 0.01 },
      release: { value: 0.2, min: 0, max: 2, step: 0.01 },
    },
    scopeData: [],
  },
  {
    id: "bass",
    label: "$bass",
    type: "synth",
    color: "var(--color-chart-2)",
    gain: 0.31,
    muted: false,
    solo: false,
    playing: true,
    sound: "sawtooth",
    scale: { root: "E", octave: 1, type: "minor" },
    notePattern: [0, 0, -1, 0, -1, 0, 0, -1], // -1 = rest
    params: {
      gain: { value: 0.31, min: 0, max: 1, step: 0.01 },
      lpf: { value: 500, min: 100, max: 2000, step: 10 },
      distort: { value: 0.75, min: 0, max: 1, step: 0.01 },
    },
    scopeData: [],
  },
  {
    id: "pad",
    label: "$pad",
    type: "pad",
    color: "var(--color-chart-3)",
    gain: 0.22,
    muted: false,
    solo: false,
    playing: true,
    sound: "supersaw",
    chords: [
      { notes: ["E3", "G3", "B3"], label: "Em" },
      { notes: ["G3", "B3", "D4"], label: "G" },
      { notes: ["B2", "E3", "G3"], label: "Em/B" },
    ],
    params: {
      gain: { value: 0.22, min: 0, max: 1, step: 0.01 },
      lpf: { value: 1200, min: 200, max: 4000, step: 10 },
      attack: { value: 0.4, min: 0, max: 2, step: 0.01 },
      release: { value: 0.8, min: 0, max: 4, step: 0.01 },
      room: { value: 0.6, min: 0, max: 1, step: 0.01 },
    },
    scopeData: [],
  },
  {
    id: "kick",
    label: "$kick",
    type: "drum",
    color: "var(--color-chart-4)",
    gain: 0.8,
    muted: false,
    solo: false,
    playing: true,
    sound: "bd",
    bank: "RolandTR808",
    drumPattern: "bd ~ bd ~",
    params: { gain: { value: 0.8, min: 0, max: 1, step: 0.01 } },
    scopeData: [],
  },
  {
    id: "snare",
    label: "$snare",
    type: "drum",
    color: "var(--color-chart-5)",
    gain: 0.7,
    muted: false,
    solo: false,
    playing: true,
    sound: "sd",
    bank: "RolandTR808",
    drumPattern: "~ sd ~ sd",
    params: { gain: { value: 0.7, min: 0, max: 1, step: 0.01 } },
    scopeData: [],
  },
  {
    id: "hats",
    label: "$hats",
    type: "drum",
    color: "var(--color-accent)",
    gain: 0.35,
    muted: false,
    solo: false,
    playing: true,
    sound: "hh",
    bank: "RolandTR808",
    drumPattern: "hh*8",
    params: { gain: { value: 0.35, min: 0, max: 1, step: 0.01 } },
    scopeData: [],
  },
];

// ─── Fake waveform generator ────────────────────────────────────────────

function generateScopeData(length: number, amplitude: number, type: Track["type"]): number[] {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    const t = i / length;
    let v: number;
    if (type === "drum") {
      v = Math.sin(t * Math.PI * 8) * Math.exp(-t * 4) * amplitude;
    } else if (type === "pad") {
      v = Math.sin(t * Math.PI * 3) * amplitude * 0.7 + Math.sin(t * Math.PI * 5.1) * amplitude * 0.3;
    } else {
      v = Math.sin(t * Math.PI * 6) * amplitude * 0.6 + Math.sin(t * Math.PI * 13) * amplitude * 0.4;
    }
    data.push(v + (Math.random() - 0.5) * 0.05);
  }
  return data;
}

// ─── Mini scope canvas ──────────────────────────────────────────────────

function MiniScope({ data, color, width = 200, height = 48 }: { data: number[]; color: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const mid = height / 2;
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * width;
      const y = mid - data[i] * mid * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data, color, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded border border-white/10"
      style={{ background: "#0b0f1a" }}
    />
  );
}

// ─── Slider component ───────────────────────────────────────────────────

function ParamSlider({
  label, value, min, max, step, color, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; color: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-muted-foreground w-14 text-right font-mono">{label}</span>
      <div className="flex-1 relative h-5 flex items-center">
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
      <span className="text-xs text-muted-foreground w-10 font-mono tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

// ─── Scale picker: root note + octave + scale type ──────────────────────

function ScalePicker({ scale, color, onChange }: {
  scale: ScaleConfig;
  color: string;
  onChange: (s: ScaleConfig) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">root note</div>
      <div className="flex gap-0.5 flex-wrap">
        {NOTE_NAMES.map((n) => (
          <button
            key={n}
            onClick={() => onChange({ ...scale, root: n })}
            className={cn(
              "h-7 rounded text-[11px] font-mono font-semibold transition-all",
              n.includes("#") ? "w-7" : "w-8",
              scale.root === n
                ? "text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            style={scale.root === n ? { background: color } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider mb-1">octave</div>
          <div className="flex gap-0.5">
            {OCTAVES.map((o) => (
              <button
                key={o}
                onClick={() => onChange({ ...scale, octave: o })}
                className={cn(
                  "w-7 h-6 rounded text-[11px] font-mono transition-all",
                  scale.octave === o
                    ? "text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
                style={scale.octave === o ? { background: color, opacity: 0.8 } : undefined}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider mb-1">scale</div>
          <div className="relative">
            <select
              value={scale.type}
              onChange={(e) => onChange({ ...scale, type: e.target.value })}
              className="w-full h-6 bg-muted/50 border border-border/50 rounded px-2 text-xs font-mono text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {SCALE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1.5 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Note pattern piano roll (scale degrees) ────────────────────────────

function NotePatternGrid({ pattern, color, onChange }: {
  pattern: number[];
  color: string;
  onChange: (p: number[]) => void;
}) {
  const maxDegree = 14;
  const rows = Array.from({ length: maxDegree + 1 }, (_, i) => maxDegree - i);

  const toggle = (step: number, degree: number) => {
    const next = [...pattern];
    if (next[step] === degree) {
      next[step] = -1; // rest
    } else {
      next[step] = degree;
    }
    onChange(next);
  };

  // Scale degree labels
  const degreeLabel = (d: number): string => {
    if (d === 0) return "1";
    if (d <= 7) return `${d + 1}`;
    return `${d - 6}'`; // octave up indicator
  };

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">note pattern (scale degrees)</div>
      <div className="flex gap-px">
        {/* Row labels */}
        <div className="flex flex-col gap-px mr-1">
          {rows.map((d) => (
            <div key={d} className="w-5 h-4 flex items-center justify-end">
              <span className={cn(
                "text-[9px] font-mono",
                d === 0 || d === 7 || d === 12 ? "text-muted-foreground" : "text-muted-foreground/40",
              )}>
                {degreeLabel(d)}
              </span>
            </div>
          ))}
        </div>
        {/* Grid */}
        {pattern.map((active, step) => (
          <div key={step} className="flex flex-col gap-px">
            {rows.map((degree) => (
              <button
                key={degree}
                onClick={() => toggle(step, degree)}
                className={cn(
                  "w-8 h-4 rounded-[2px] transition-all border",
                  active === degree
                    ? "border-transparent"
                    : "border-transparent bg-muted/20 hover:bg-muted/50",
                  // Highlight octave boundaries
                  (degree === 0 || degree === 7 || degree === 12) && active !== degree && "bg-muted/30",
                )}
                style={active === degree ? { background: color, opacity: 0.85 } : undefined}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-px ml-6">
        {pattern.map((_, step) => (
          <div key={step} className="w-8 text-center">
            <span className="text-[9px] font-mono text-muted-foreground/40">{step + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chord progression editor ───────────────────────────────────────────

function ChordProgression({ chords, color, onChange }: {
  chords: ChordStep[];
  color: string;
  onChange: (c: ChordStep[]) => void;
}) {
  const CHORD_OPTIONS = ["Em", "G", "Am", "Bm", "C", "D", "Em/B", "Am/E", "G/B"];

  const updateChord = (index: number, label: string) => {
    const chordNoteMap: Record<string, string[]> = {
      "Em": ["E3", "G3", "B3"],
      "G": ["G3", "B3", "D4"],
      "Am": ["A3", "C4", "E4"],
      "Bm": ["B3", "D4", "F#4"],
      "C": ["C3", "E3", "G3"],
      "D": ["D3", "F#3", "A3"],
      "Em/B": ["B2", "E3", "G3"],
      "Am/E": ["E3", "A3", "C4"],
      "G/B": ["B2", "D3", "G3"],
    };
    const next = [...chords];
    next[index] = { notes: chordNoteMap[label] || chords[index].notes, label };
    onChange(next);
  };

  const addChord = () => {
    onChange([...chords, { notes: ["E3", "G3", "B3"], label: "Em" }]);
  };

  const removeChord = (index: number) => {
    if (chords.length <= 1) return;
    onChange(chords.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">chord progression</div>
      <div className="flex gap-2 items-end">
        {chords.map((chord, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <button
              onClick={() => removeChord(i)}
              className="text-[9px] text-muted-foreground/40 hover:text-destructive transition-colors"
            >
              x
            </button>
            <div
              className="w-16 rounded-lg border-2 p-2 flex flex-col items-center gap-1 transition-all cursor-pointer"
              style={{ borderColor: color }}
            >
              <span className="text-sm font-bold font-mono" style={{ color }}>{chord.label}</span>
              <div className="flex flex-col items-center">
                {chord.notes.map((n, ni) => (
                  <span key={ni} className="text-[9px] font-mono text-muted-foreground">{n}</span>
                ))}
              </div>
            </div>
            <div className="relative">
              <select
                value={chord.label}
                onChange={(e) => updateChord(i, e.target.value)}
                className="w-16 h-5 bg-muted/30 border border-border/50 rounded text-[10px] font-mono text-muted-foreground appearance-none text-center cursor-pointer focus:outline-none"
              >
                {CHORD_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/40">beat {i + 1}</span>
          </div>
        ))}
        <button
          onClick={addChord}
          className="w-10 h-10 rounded-lg border border-dashed border-border/50 text-muted-foreground/40 hover:text-foreground hover:border-border transition-colors flex items-center justify-center text-lg mb-6"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Sound selector dropdown ────────────────────────────────────────────

function SoundSelector({ value, color, onChange, options }: {
  value: string;
  color: string;
  onChange: (s: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-14 text-right font-mono">sound</span>
      <div className="relative flex-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-7 bg-muted/30 border border-border/50 rounded px-2 text-xs font-mono text-foreground appearance-none focus:outline-none focus:ring-1 cursor-pointer"
          style={{ "--tw-ring-color": color } as React.CSSProperties}
        >
          {options.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Track card ─────────────────────────────────────────────────────────

function TrackCard({
  track,
  globalPlaying,
  onToggleMute,
  onTogglePlay,
  onToggleSolo,
  onParamChange,
  onScaleChange,
  onPatternChange,
  onChordChange,
  onSoundChange,
  onBankChange,
}: {
  track: Track;
  globalPlaying: boolean;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onToggleSolo: () => void;
  onParamChange: (param: string, value: number) => void;
  onScaleChange: (s: ScaleConfig) => void;
  onPatternChange: (p: number[]) => void;
  onChordChange: (c: ChordStep[]) => void;
  onSoundChange: (s: string) => void;
  onBankChange: (b: string) => void;
}) {
  const isActive = track.playing && globalPlaying && !track.muted;

  return (
    <div className={cn(
      "rounded-lg border transition-all flex overflow-hidden",
      track.muted ? "border-border/50 opacity-40" : "border-border",
      "bg-card",
    )}>
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={onTogglePlay}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center transition-all",
              track.playing && !track.muted
                ? "text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            style={track.playing && !track.muted ? { background: track.color } : undefined}
          >
            {track.playing ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-px" />}
          </button>
          <span className="font-mono text-sm font-semibold flex-1" style={{ color: track.muted ? undefined : track.color }}>
            {track.label}
          </span>
          <button onClick={onToggleMute} className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors",
            track.muted ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground hover:text-foreground",
          )}>M</button>
          <button onClick={onToggleSolo} className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors",
            track.solo ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground hover:text-foreground",
          )}>S</button>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-mono tabular-nums text-muted-foreground w-8">{Math.round(track.gain * 100)}%</span>
          </div>
        </div>

        {/* Musical UI — varies by track type */}
        <div className="px-3 pb-2 space-y-3">
          {/* Scale picker for synths */}
          {track.scale && (
            <ScalePicker scale={track.scale} color={track.color} onChange={onScaleChange} />
          )}

          {/* Note pattern grid for synths */}
          {track.notePattern && (
            <NotePatternGrid pattern={track.notePattern} color={track.color} onChange={onPatternChange} />
          )}

          {/* Chord progression for pads */}
          {track.chords && (
            <ChordProgression chords={track.chords} color={track.color} onChange={onChordChange} />
          )}

          {/* Sound selector */}
          {track.type !== "drum" && (
            <SoundSelector value={track.sound} color={track.color} onChange={onSoundChange} options={SYNTH_SOUNDS} />
          )}

          {/* Bank selector for drums */}
          {track.type === "drum" && track.bank && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-14 text-right font-mono">bank</span>
              <div className="relative flex-1">
                <select
                  value={track.bank}
                  onChange={(e) => onBankChange(e.target.value)}
                  className="w-full h-7 bg-muted/30 border border-border/50 rounded px-2 text-xs font-mono text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {DRUM_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Param sliders */}
        <div className="px-3 pb-3 space-y-1 border-t border-border/50 pt-2">
          {Object.entries(track.params).map(([key, param]) => (
            <ParamSlider
              key={key} label={key} value={param.value} min={param.min} max={param.max} step={param.step}
              color={track.color} onChange={(v) => onParamChange(key, v)}
            />
          ))}
        </div>
      </div>

      {/* Scope strip */}
      <div
        className="w-[72px] flex-shrink-0 border-l border-border/50 flex flex-col items-center justify-center gap-1 relative"
        style={{ background: isActive ? `color-mix(in srgb, ${track.color} 4%, transparent)` : undefined }}
      >
        {isActive && track.scopeData.length > 0 ? (
          <>
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: track.color, opacity: 0.5 }}>scope</span>
            </div>
            <MiniScope data={track.scopeData} color={track.color} width={56} height={120} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
            <span className="text-[8px] font-mono text-muted-foreground/20">off</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step sequencer (drums) ─────────────────────────────────────────────

function StepSequencer() {
  const [steps, setSteps] = useState<boolean[][]>([
    [true, false, false, false, true, false, false, false],
    [false, false, true, false, false, false, true, false],
    [true, true, true, true, true, true, true, true],
  ]);
  const labels = ["kick", "snare", "hats"];
  const colors = ["var(--color-chart-4)", "var(--color-chart-5)", "var(--color-accent)"];

  const toggle = (row: number, col: number) => {
    setSteps((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = !next[row][col];
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground mb-2 font-mono">drum sequencer</div>
      <div className="space-y-1.5">
        {steps.map((row, ri) => (
          <div key={ri} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{labels[ri]}</span>
            <div className="flex gap-1">
              {row.map((active, ci) => (
                <button
                  key={ci}
                  onClick={() => toggle(ri, ci)}
                  className={cn(
                    "w-7 h-7 rounded-sm border transition-all",
                    active ? "border-transparent" : "border-border bg-muted/30 hover:bg-muted/60",
                    ci % 4 === 0 && !active && "border-border/80",
                  )}
                  style={active ? { background: colors[ri], opacity: 0.9 } : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transport bar ──────────────────────────────────────────────────────

function TransportBar({ isPlaying, onToggle, bpm, onBpmChange, scaleRoot, scaleType }: {
  isPlaying: boolean;
  onToggle: () => void;
  bpm: number;
  onBpmChange: (v: number) => void;
  scaleRoot: string;
  scaleType: string;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card/50">
      <button
        onClick={onToggle}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          isPlaying
            ? "bg-primary text-primary-foreground shadow-[0_0_12px_var(--color-primary)]"
            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
        )}
      >
        {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono">BPM</span>
        <input
          type="number" value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value) || 84)}
          className="w-12 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-sm font-mono text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-xs text-muted-foreground/50 font-mono">/4</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <span className={cn("w-2 h-2 rounded-full", isPlaying ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
        {isPlaying ? "playing" : "stopped"}
      </div>
      <span className="text-muted-foreground/30">|</span>
      <span className="text-xs text-muted-foreground font-mono">{scaleRoot.toLowerCase()} {scaleType}</span>
    </div>
  );
}

// ─── Chat messages ──────────────────────────────────────────────────────

const MOCK_MESSAGES = [
  { id: "1", role: "user" as const, content: "make a dark e minor track with supersaw arp, heavy bass, and 808 drums" },
  { id: "2", role: "assistant" as const, content: "Here's your track — 6 layers in E minor at 84 BPM. I've set up the arp with a descending pattern, added a distorted sawtooth bass, pads for depth, and TR-808 drums. Tweak anything in the mixer.", ui: true },
  { id: "3", role: "user" as const, content: "add more reverb to the pad and bring the bass up" },
  { id: "4", role: "assistant" as const, content: "Done — bumped the pad room to 0.6 and bass gain to 0.45. The pad should feel more spacious now." },
];

// ─── Generate Strudel code from track state ─────────────────────────────

function trackToCode(track: Track, bpm: number): string {
  if (track.type === "drum") {
    const parts = [`s("${track.drumPattern ?? ""}")`];
    if (track.bank) parts.push(`.bank("${track.bank}")`);
    parts.push(`.gain(slider(${track.params.gain?.value ?? 0.5},0,1,0.01))`);
    return `$${track.id}: ${parts.join("")}`;
  }

  if (track.type === "pad" && track.chords) {
    const chordStr = track.chords.map((c) => `[${c.notes.join(",")}]`).join(" ");
    const parts = [`note("<${chordStr}>")`];
    parts.push(`.s("${track.sound}")`);
    if (track.params.lpf) parts.push(`.lpf(${track.params.lpf.value})`);
    parts.push(`.gain(slider(${track.params.gain?.value ?? 0.5},0,1,0.01))`);
    if (track.params.attack) parts.push(`.attack(${track.params.attack.value})`);
    if (track.params.release) parts.push(`.release(${track.params.release.value})`);
    if (track.params.room) parts.push(`.room(${track.params.room.value})`);
    return `$${track.id}: ${parts.join("\n  ")}`;
  }

  // synth
  const pattern = track.notePattern ? track.notePattern.map((n) => n === -1 ? "~" : n).join(" ") : "0";
  const parts = [`n("${pattern}")`];
  if (track.scale) parts.push(`.scale("${track.scale.root.toLowerCase()}${track.scale.octave}:${track.scale.type}")`);
  parts.push(`.s("${track.sound}")`);
  if (track.params.detune) parts.push(`.superimpose(x => x.detune(${track.params.detune.value}))`);
  if (track.params.lpf) parts.push(`.lpf(perlin.slow(2).range(300, ${track.params.lpf.value}))`);
  parts.push(`.gain(slider(${track.params.gain?.value ?? 0.5},0,1,0.01))`);
  if (track.params.attack) parts.push(`.attack(${track.params.attack.value})`);
  if (track.params.release) parts.push(`.release(${track.params.release.value})`);
  if (track.params.distort) parts.push(`.distort(slider(${track.params.distort.value},0,1,0.01))`);
  parts.push(`._scope({ height: 120, scale: 0.5 })`);
  return `$${track.id}: ${parts.join("\n  ")}`;
}

function generateFullCode(tracks: Track[], bpm: number): string {
  const lines = [`setCpm(${bpm}/4)\n`];
  for (const t of tracks) {
    lines.push(trackToCode(t, bpm));
    lines.push("");
  }
  return lines.join("\n");
}

// ─── Code view ──────────────────────────────────────────────────────────

function CodeView({ code, onChange }: { code: string; onChange: (c: string) => void }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 bg-card text-foreground font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
        style={{ tabSize: 2 }}
      />
    </div>
  );
}

// ─── View mode toggle ───────────────────────────────────────────────────

type ViewMode = "ui" | "code";

function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
      <button
        onClick={() => onChange("ui")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all",
          mode === "ui"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="w-3 h-3" />
        UI
      </button>
      <button
        onClick={() => onChange("code")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all",
          mode === "code"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Code className="w-3 h-3" />
        Code
      </button>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────

export default function UIMockupPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [bpm, setBpm] = useState(84);
  const [viewMode, setViewMode] = useState<ViewMode>("ui");
  const [tracks, setTracks] = useState<Track[]>(() =>
    INITIAL_TRACKS.map((t) => ({ ...t, scopeData: generateScopeData(100, t.gain, t.type) }))
  );
  const [inputValue, setInputValue] = useState("");
  const [codeText, setCodeText] = useState("");

  // Sync code text when switching to code mode
  useEffect(() => {
    if (viewMode === "code") {
      setCodeText(generateFullCode(tracks, bpm));
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive global scale from the arp track
  const arpTrack = tracks.find((t) => t.id === "arp");
  const globalScale = arpTrack?.scale ?? { root: "E", octave: 3, type: "minor" };

  // Animate scopes
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTracks((prev) =>
        prev.map((t) => ({
          ...t,
          scopeData: t.muted || !t.playing ? [] : generateScopeData(100, t.gain, t.type),
        }))
      );
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const updateTrack = useCallback((id: string, updater: (t: Track) => Track) => {
    setTracks((prev) => prev.map((t) => t.id === id ? updater(t) : t));
  }, []);

  const toggleMute = useCallback((id: string) => {
    updateTrack(id, (t) => ({ ...t, muted: !t.muted }));
  }, [updateTrack]);

  const togglePlay = useCallback((id: string) => {
    updateTrack(id, (t) => ({ ...t, playing: !t.playing }));
  }, [updateTrack]);

  const toggleSolo = useCallback((id: string) => {
    setTracks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const newSolo = !target.solo;
      if (newSolo) {
        return prev.map((t) => ({ ...t, solo: t.id === id, muted: t.id !== id }));
      }
      return prev.map((t) => ({ ...t, solo: false, muted: false }));
    });
  }, []);

  const updateParam = useCallback((trackId: string, param: string, value: number) => {
    updateTrack(trackId, (t) => {
      const newParams = { ...t.params, [param]: { ...t.params[param], value } };
      return { ...t, params: newParams, gain: param === "gain" ? value : t.gain };
    });
  }, [updateTrack]);

  const renderTrackCard = (track: Track) => (
    <TrackCard
      key={track.id}
      track={track}
      globalPlaying={isPlaying}
      onToggleMute={() => toggleMute(track.id)}
      onTogglePlay={() => togglePlay(track.id)}
      onToggleSolo={() => toggleSolo(track.id)}
      onParamChange={(p, v) => updateParam(track.id, p, v)}
      onScaleChange={(s) => updateTrack(track.id, (t) => ({ ...t, scale: s }))}
      onPatternChange={(p) => updateTrack(track.id, (t) => ({ ...t, notePattern: p }))}
      onChordChange={(c) => updateTrack(track.id, (t) => ({ ...t, chords: c }))}
      onSoundChange={(s) => updateTrack(track.id, (t) => ({ ...t, sound: s }))}
      onBankChange={(b) => updateTrack(track.id, (t) => ({ ...t, bank: b }))}
    />
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Strudel LM</h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">UI Mockup</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">concept: generative UI view</span>
      </header>

      {/* Transport */}
      <TransportBar
        isPlaying={isPlaying}
        onToggle={() => setIsPlaying(!isPlaying)}
        bpm={bpm}
        onBpmChange={setBpm}
        scaleRoot={globalScale.root}
        scaleType={globalScale.type}
      />

      {/* Main content — tracks left, chat+viz right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Mode toggle + Track mixer or Code editor */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Mode toggle bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              {viewMode === "ui" ? "drag sliders, click notes, pick chords" : "edit strudel code directly"}
            </span>
          </div>

          {viewMode === "ui" ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono mb-1">synths</div>
              {tracks.filter((t) => t.type !== "drum").map(renderTrackCard)}

              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono mt-4 mb-1">drums</div>
              <StepSequencer />
              {tracks.filter((t) => t.type === "drum").map(renderTrackCard)}
            </div>
          ) : (
            <CodeView code={codeText} onChange={setCodeText} />
          )}
        </div>

        {/* Right: Visualization + Chat */}
        <div className="w-[420px] border-l border-border flex flex-col bg-background">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {MOCK_MESSAGES.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}>
                  {msg.content}
                  {msg.ui && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Sliders className="w-3 h-3" />
                      rendered: TrackMixer
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="px-3 pb-2 flex gap-2 flex-wrap">
            {["add a breakdown", "make the arp faster", "swap to 909 drums"].map((s) => (
              <button
                key={s}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder="describe what you want to hear..."
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
