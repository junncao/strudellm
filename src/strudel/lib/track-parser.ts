export type Track = {
  id: string;
  name: string;
  code: string;
  muted: boolean;
  soloed: boolean;
  volume: number;
};

export type DawState = {
  preamble: string;
  tracks: Track[];
  rawCode: string;
  isMultiTrack: boolean;
};

// Matches $name: or _$name: at the start of a line, capturing the rest until the next such line
const TRACK_BLOCK_RE = /^(_?\$)([a-zA-Z0-9_]+):([ \t]*)(.*)$/gm;

// Extracts the first .gain(N) or .gain(N.N) value from a code string
const GAIN_RE = /\.gain\(\s*([\d.]+)\s*\)/;

function extractVolume(code: string): number {
  const m = GAIN_RE.exec(code);
  if (m) {
    const v = parseFloat(m[1]);
    return isNaN(v) ? 0.8 : Math.min(1, Math.max(0, v));
  }
  return 0.8;
}

function injectGain(code: string, volume: number): string {
  const rounded = Math.round(volume * 100) / 100;
  if (GAIN_RE.test(code)) {
    return code.replace(GAIN_RE, `.gain(${rounded})`);
  }
  // Append before a trailing comment or at the end of first line
  const firstNewline = code.indexOf("\n");
  if (firstNewline === -1) {
    return `${code}.gain(${rounded})`;
  }
  return `${code.slice(0, firstNewline)}.gain(${rounded})${code.slice(firstNewline)}`;
}

let trackIdCounter = 0;
function nextId(): string {
  return `track-${++trackIdCounter}`;
}

export function parseTracksFromCode(code: string): DawState {
  if (!code || !code.trim()) {
    return { preamble: "", tracks: [], rawCode: code ?? "", isMultiTrack: false };
  }

  // Split into lines to find track block boundaries
  const lines = code.split("\n");
  const trackStartIndices: Array<{ lineIdx: number; muted: boolean; name: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const m = /^(_?\$)([a-zA-Z0-9_]+):/.exec(lines[i]);
    if (m) {
      trackStartIndices.push({ lineIdx: i, muted: m[1] === "_$", name: m[2] });
    }
  }

  if (trackStartIndices.length === 0) {
    return { preamble: "", tracks: [], rawCode: code, isMultiTrack: false };
  }

  // Everything before first track block is preamble
  const preambleLines = lines.slice(0, trackStartIndices[0].lineIdx);
  const preamble = preambleLines.join("\n").trimEnd();

  const tracks: Track[] = trackStartIndices.map((entry, idx) => {
    const start = entry.lineIdx;
    const end =
      idx + 1 < trackStartIndices.length
        ? trackStartIndices[idx + 1].lineIdx
        : lines.length;

    // First line: strip the $name: prefix
    const firstLine = lines[start].replace(/^_?\$[a-zA-Z0-9_]+:[ \t]*/, "");
    const blockLines = [firstLine, ...lines.slice(start + 1, end)];
    const rawBlockCode = blockLines.join("\n").trimEnd();

    const volume = extractVolume(rawBlockCode);

    return {
      id: nextId(),
      name: entry.name,
      code: rawBlockCode,
      muted: entry.muted,
      soloed: false,
      volume,
    };
  });

  return { preamble, tracks, rawCode: code, isMultiTrack: true };
}

export function compileTracksToCode(state: DawState): string {
  if (!state.isMultiTrack) {
    return state.rawCode;
  }

  const anySoloed = state.tracks.some((t) => t.soloed);

  const parts: string[] = [];

  if (state.preamble.trim()) {
    parts.push(state.preamble.trim());
    parts.push("");
  }

  for (const track of state.tracks) {
    const effectivelyMuted = track.muted || (anySoloed && !track.soloed);
    // Use gain(0) instead of _$name: so the scheduler hot-swaps without stop/restart.
    // This makes mute/solo take effect within the scheduler's lookahead (~100-250ms)
    // rather than waiting for a full stop-restart cycle (500ms+).
    const effectiveVolume = effectivelyMuted ? 0 : track.volume;
    const codeWithGain = injectGain(track.code, effectiveVolume);
    parts.push(`$${track.name}: ${codeWithGain.trim()}`);
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
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, "_");
  const newTrack: Track = {
    id: nextId(),
    name: safeName,
    code: `s("~")`,
    muted: false,
    soloed: false,
    volume: 0.8,
  };
  return {
    ...state,
    isMultiTrack: true,
    tracks: [...state.tracks, newTrack],
  };
}
