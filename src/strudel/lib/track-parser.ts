export type Track = {
  id: string;
  name: string;
  /** Pattern code WITHOUT the leading `$name:` label and WITHOUT any DAW-injected `.gain()`. */
  code: string;
  muted: boolean;
  soloed: boolean;
  /**
   * User-controlled master fader (post-multiplier on top of whatever gain the
   * AI/user wrote in the pattern). 1.0 = no attenuation. Does NOT mirror or
   * overwrite gains inside the pattern code.
   */
  volume: number;
  /**
   * True when this Track was synthesized from raw code that didn't contain any
   * `$name:` label. We keep one virtual "main" track so the user has volume /
   * mute / solo controls; on compile we omit the `$main:` prefix unless the
   * user has actually interacted (mute/solo/non-default volume).
   */
  isVirtual?: boolean;
};

export type DawState = {
  preamble: string;
  tracks: Track[];
  rawCode: string;
  isMultiTrack: boolean;
};

// Captures any `$name:` or `_$name:` label, allowing leading whitespace and an
// empty name (anonymous `$:` syntax that Strudel auto-numbers as $0, $1, ...).
// Groups: 1=indent, 2=`_$`|`$`, 3=name (may be empty), 4=spacing, 5=rest of line.
const TRACK_LINE_RE = /^([ \t]*)(_?\$)([a-zA-Z0-9_]*):([ \t]*)(.*)$/;

const VIRTUAL_TRACK_NAME = "main";

let trackIdCounter = 0;
function nextId(): string {
  return `track-${++trackIdCounter}`;
}

/**
 * Make `name` unique within `taken`. If `name` already exists, append `_2`,
 * `_3`, etc. Mutates and returns `taken` for caller convenience.
 */
function disambiguate(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  let i = 2;
  while (taken.has(`${name}_${i}`)) i++;
  const next = `${name}_${i}`;
  taken.add(next);
  return next;
}

type RawBlock = {
  name: string; // resolved unique name
  rawName: string; // original label as written (may be empty for `$:`)
  muted: boolean;
  lines: string[];
};

function splitIntoBlocks(code: string): {
  preamble: string;
  blocks: RawBlock[];
} {
  const lines = code.split("\n");
  const preambleLines: string[] = [];
  const blocks: RawBlock[] = [];
  const usedNames = new Set<string>();
  let current: RawBlock | null = null;
  let anonCounter = 0;

  const finishCurrent = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const line of lines) {
    const m = TRACK_LINE_RE.exec(line);
    if (m) {
      finishCurrent();
      const muted = m[2] === "_$";
      const rawName = m[3];
      const baseName = rawName || `track${++anonCounter}`;
      const uniqueName = disambiguate(baseName, usedNames);
      current = {
        name: uniqueName,
        rawName,
        muted,
        lines: [m[5]], // content after the label on the same line
      };
    } else if (current) {
      current.lines.push(line);
    } else {
      preambleLines.push(line);
    }
  }
  finishCurrent();

  return {
    preamble: preambleLines.join("\n").trimEnd(),
    blocks,
  };
}

export function parseTracksFromCode(code: string): DawState {
  if (!code || !code.trim()) {
    return { preamble: "", tracks: [], rawCode: code ?? "", isMultiTrack: false };
  }

  const { preamble, blocks } = splitIntoBlocks(code);

  if (blocks.length === 0) {
    // No track labels: synthesize one virtual track so the user still has
    // mute/solo/volume controls. On compile we omit the prefix unless the
    // user has interacted.
    const trimmed = code.trim();
    if (!trimmed) {
      return { preamble: "", tracks: [], rawCode: code, isMultiTrack: false };
    }
    return {
      preamble: "",
      tracks: [
        {
          id: nextId(),
          name: VIRTUAL_TRACK_NAME,
          code: code.replace(/^\s*\n/, "").trimEnd(),
          muted: false,
          soloed: false,
          volume: 1,
          isVirtual: true,
        },
      ],
      rawCode: code,
      isMultiTrack: true,
    };
  }

  const tracks: Track[] = blocks.map((b) => ({
    id: nextId(),
    name: b.name,
    code: b.lines.join("\n").replace(/^\s*\n/, "").trimEnd(),
    muted: b.muted,
    soloed: false,
    volume: 1,
  }));

  return { preamble, tracks, rawCode: code, isMultiTrack: true };
}

/**
 * Build a `.gain(...)` suffix for a track based on its mute/solo/volume state.
 * Returns "" when nothing needs to be added (so we don't pollute the code).
 */
function gainSuffix(volume: number, effectivelyMuted: boolean): string {
  if (effectivelyMuted) return ".gain(0)";
  // Treat anything within 1% of 1.0 as "no change" to avoid float noise.
  if (volume >= 0.999) return "";
  const v = Math.max(0, Math.round(volume * 100) / 100);
  return `.gain(${v})`;
}

export function compileTracksToCode(state: DawState): string {
  if (!state.isMultiTrack || state.tracks.length === 0) {
    return state.rawCode;
  }

  const anySoloed = state.tracks.some((t) => t.soloed);

  // Special-case: a single virtual track that the user hasn't touched —
  // round-trip the original code so we don't clutter it with `$main:`.
  if (state.tracks.length === 1 && state.tracks[0].isVirtual) {
    const t = state.tracks[0];
    // SOLO overrides MUTE (standard DAW convention): a soloed track always
    // plays, even if its mute toggle is on. Without solo, a track is silent
    // when explicitly muted OR when another track is soloed.
    const effectivelyMuted = t.soloed ? false : t.muted || anySoloed;
    const suffix = gainSuffix(t.volume, effectivelyMuted);
    if (!suffix) {
      // No interaction → emit code unchanged.
      return state.rawCode;
    }
    // User attenuated/muted → promote to a real labeled track so the gain
    // suffix attaches to the whole pattern, not a sub-expression.
    return [
      state.preamble.trim(),
      state.preamble.trim() ? "" : null,
      `$${t.name}: ${t.code.trim()}${suffix}`,
      "",
    ]
      .filter((x) => x !== null)
      .join("\n")
      .trimEnd() + "\n";
  }

  const parts: string[] = [];
  if (state.preamble.trim()) {
    parts.push(state.preamble.trim());
    parts.push("");
  }

  for (const track of state.tracks) {
    // SOLO overrides MUTE: a soloed track always plays. Otherwise the track
    // is silent when explicitly muted OR when at least one other track is
    // soloed. This matches standard DAW conventions.
    const effectivelyMuted = track.soloed
      ? false
      : track.muted || anySoloed;
    const suffix = gainSuffix(track.volume, effectivelyMuted);
    parts.push(`$${track.name}: ${track.code.trim()}${suffix}`);
    parts.push("");
  }

  return parts.join("\n").trimEnd() + "\n";
}

export function updateTrackVolume(state: DawState, trackId: string, volume: number): DawState {
  return {
    ...state,
    tracks: state.tracks.map((t) =>
      t.id === trackId ? { ...t, volume } : t
    ),
  };
}

export function toggleMute(state: DawState, trackId: string): DawState {
  return {
    ...state,
    tracks: state.tracks.map((t) =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    ),
  };
}

export function toggleSolo(state: DawState, trackId: string): DawState {
  return {
    ...state,
    tracks: state.tracks.map((t) =>
      t.id === trackId ? { ...t, soloed: !t.soloed } : t
    ),
  };
}

export function addTrack(state: DawState, name: string): DawState {
  const safeBase = name.replace(/[^a-zA-Z0-9_]/g, "_") || "track";
  const used = new Set(state.tracks.map((t) => t.name));
  const uniqueName = disambiguate(safeBase, used);
  const newTrack: Track = {
    id: nextId(),
    name: uniqueName,
    code: `s("~")`,
    muted: false,
    soloed: false,
    volume: 1,
  };
  // If we were in single/empty mode and a virtual "main" track exists, keep it.
  return {
    ...state,
    isMultiTrack: true,
    tracks: [...state.tracks, newTrack],
  };
}
