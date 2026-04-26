/**
 * Tempo helpers for the DAW header.
 *
 * Strudel's primitive is the "cycle" (fundamental period). Common idioms:
 *   setCpm(120/4)   → 120 BPM in 4/4 time (= 30 cycles per minute)
 *   setCpm(N)       → N cycles per minute (BPM unclear without beats/cycle)
 *   setCps(N)       → N cycles per second (60·N cycles per minute)
 *
 * We round-trip through the canonical form `setCpm(BPM/beatsPerCycle)` because
 * that is how the DAW expresses tempo to the user (beats per minute + time
 * signature numerator).
 */

export type Tempo = {
  bpm: number;
  beatsPerCycle: number;
};

export const DEFAULT_TEMPO: Tempo = { bpm: 120, beatsPerCycle: 4 };

// Single-line tempo statements. We intentionally restrict to one line so we
// don't interfere with multiline music expressions further down.
const CPM_FRACTION_RE =
  /set[Cc]pm\s*\(\s*([\d.]+)\s*\/\s*([\d.]+)\s*\)/;
const CPM_PLAIN_RE = /set[Cc]pm\s*\(\s*([\d.]+)\s*\)/;
const CPS_RE = /set[Cc]ps\s*\(\s*([\d.]+)\s*\)/;

const TEMPO_LINE_RE = /^[ \t]*set(?:[Cc]pm|[Cc]ps)\s*\([^)]*\)\s*;?\s*$/m;

function clampPositive(n: number, fallback: number): number {
  if (!isFinite(n) || n <= 0) return fallback;
  return n;
}

/**
 * Pull a `Tempo` out of preamble (or any code chunk). Falls back to
 * DEFAULT_TEMPO if no setCpm/setCps line is found.
 */
export function parseTempo(source: string): Tempo {
  if (!source) return DEFAULT_TEMPO;

  const fraction = CPM_FRACTION_RE.exec(source);
  if (fraction) {
    const bpm = parseFloat(fraction[1]);
    const beats = parseFloat(fraction[2]);
    return {
      bpm: Math.round(clampPositive(bpm, DEFAULT_TEMPO.bpm)),
      beatsPerCycle: Math.round(
        clampPositive(beats, DEFAULT_TEMPO.beatsPerCycle),
      ),
    };
  }

  const cpm = CPM_PLAIN_RE.exec(source);
  if (cpm) {
    const value = parseFloat(cpm[1]);
    if (isFinite(value) && value > 0) {
      // setCpm(N) without /M — assume 4 beats per cycle so BPM = 4·N.
      return {
        bpm: Math.round(value * DEFAULT_TEMPO.beatsPerCycle),
        beatsPerCycle: DEFAULT_TEMPO.beatsPerCycle,
      };
    }
  }

  const cps = CPS_RE.exec(source);
  if (cps) {
    const value = parseFloat(cps[1]);
    if (isFinite(value) && value > 0) {
      // setCps(N) → N cycles/sec → 60·N cpm → 60·N·beatsPerCycle BPM.
      return {
        bpm: Math.round(value * 60 * DEFAULT_TEMPO.beatsPerCycle),
        beatsPerCycle: DEFAULT_TEMPO.beatsPerCycle,
      };
    }
  }

  return DEFAULT_TEMPO;
}

/**
 * Produce a new preamble with the given tempo applied. Replaces an existing
 * setCpm/setCps line in place; otherwise prepends one with a blank line gap.
 */
export function withTempo(preamble: string, tempo: Tempo): string {
  const safe: Tempo = {
    bpm: Math.max(1, Math.round(tempo.bpm)),
    beatsPerCycle: Math.max(1, Math.round(tempo.beatsPerCycle)),
  };
  const line = `setCpm(${safe.bpm}/${safe.beatsPerCycle})`;

  if (TEMPO_LINE_RE.test(preamble)) {
    return preamble.replace(TEMPO_LINE_RE, line);
  }
  if (!preamble.trim()) {
    return line;
  }
  return `${line}\n\n${preamble}`;
}
