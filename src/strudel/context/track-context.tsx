"use client";

import * as React from "react";
import {
  type DawState,
  parseTracksFromCode,
  compileTracksToCode,
  addTrack,
} from "@/strudel/lib/track-parser";
import { type Tempo, withTempo } from "@/strudel/lib/tempo";
import { StrudelService } from "@/strudel/lib/service";

type TrackContextValue = {
  dawState: DawState;
  setMute: (trackId: string, muted: boolean) => void;
  setSolo: (trackId: string) => void;
  setVolume: (trackId: string, volume: number) => void;
  addNewTrack: (name: string) => void;
  /**
   * Update a single track's code from the per-track editor.
   * - apply=false: only persist the draft into DAW state (no recompile, no
   *   audio change). Use during typing so toggling the panel doesn't lose
   *   work.
   * - apply=true: persist AND recompile the full pattern, hot-evaluating
   *   into the running scheduler. Use on blur / debounce flush.
   */
  updateTrackCode: (trackId: string, code: string, apply: boolean) => void;
  /**
   * Push a complete, full-pattern code string (i.e. the contents of the
   * "View Code" dialog) into the REPL. The service's onStateChange echo will
   * re-parse it back into tracks.
   */
  setRawCode: (code: string) => void;
  /**
   * Update the project tempo (bpm + beats per cycle). Rewrites the preamble's
   * `setCpm(...)` line and hot-evaluates so the change is audible immediately.
   */
  setTempo: (tempo: Tempo) => void;
};

const TrackContext = React.createContext<TrackContextValue | null>(null);

const EMPTY_STATE: DawState = {
  preamble: "",
  tracks: [],
  rawCode: "",
  isMultiTrack: false,
};

export function TrackProvider({ children }: { children: React.ReactNode }) {
  const [dawState, setDawState] = React.useState<DawState>(EMPTY_STATE);
  // Keep a ref so async callbacks always see current state without stale closures
  const dawStateRef = React.useRef<DawState>(dawState);
  React.useEffect(() => {
    dawStateRef.current = dawState;
  }, [dawState]);

  const service = React.useMemo(() => StrudelService.instance(), []);

  // Initialize from current service state on mount, then subscribe to changes
  React.useEffect(() => {
    const loadState = (code: string) => {
      if (!code) return;
      setDawState((prev) => {
        if (prev.rawCode === code) return prev;
        const parsed = parseTracksFromCode(code);
        // Preserve user-controlled fader state (muted, soloed, volume) across
        // re-parses. Volume is a master post-multiplier (default 1.0), so even
        // if the AI rewrites the in-pattern gain, the user's slider position
        // stays put. Match by track name; new tracks from AI get defaults.
        if (parsed.isMultiTrack && prev.isMultiTrack) {
          const prevByName = new Map(prev.tracks.map((t) => [t.name, t]));
          parsed.tracks = parsed.tracks.map((t) => {
            const existing = prevByName.get(t.name);
            if (!existing) return t;
            return {
              ...t,
              muted: existing.muted,
              soloed: existing.soloed,
              volume: existing.volume,
            };
          });
        }
        return parsed;
      });
    };

    // Load current state immediately (don't wait for the first change event)
    const initial = service.getReplState();
    if (initial?.code) {
      loadState(initial.code);
    }

    const unsubscribe = service.onStateChange((replState) => {
      if (replState.code) loadState(replState.code);
    });

    return unsubscribe;
  }, [service]);

  // Apply user-driven track changes (mute/solo/volume) via hot-evaluate.
  // Pre-sets rawCode so loadState's rawCode check short-circuits on the
  // onStateChange echo, avoiding a redundant second render.
  const applyTracks = React.useCallback(
    (next: DawState) => {
      if (!next.isMultiTrack) {
        setDawState(next);
        return;
      }
      const code = compileTracksToCode(next);
      const nextWithCode = { ...next, rawCode: code };
      setDawState(nextWithCode);
      service.hotEvaluate(code);
    },
    [service]
  );

  const setMute = React.useCallback(
    (trackId: string, muted: boolean) => {
      const prev = dawStateRef.current;
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, muted } : t)),
      };
      applyTracks(next);
    },
    [applyTracks]
  );

  const setSolo = React.useCallback(
    (trackId: string) => {
      // Exclusive solo: clicking SOLO on a track makes it the only audible
      // track (clears solo on every other track). Clicking the same SOLO
      // again releases it and restores the normal mute state across the
      // board. compileTracksToCode then mutes any non-soloed track via
      // .gain(0) when at least one solo is active.
      const prev = dawStateRef.current;
      const target = prev.tracks.find((t) => t.id === trackId);
      if (!target) return;
      const willSolo = !target.soloed;
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) => ({
          ...t,
          soloed: t.id === trackId ? willSolo : false,
        })),
      };
      applyTracks(next);
    },
    [applyTracks]
  );

  const setVolume = React.useCallback(
    (trackId: string, volume: number) => {
      const prev = dawStateRef.current;
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t)),
      };
      applyTracks(next);
    },
    [applyTracks]
  );

  const addNewTrack = React.useCallback(
    (name: string) => {
      const prev = dawStateRef.current;
      const next = addTrack(prev, name);
      applyTracks(next);
    },
    [applyTracks]
  );

  const updateTrackCode = React.useCallback(
    (trackId: string, code: string, apply: boolean) => {
      const prev = dawStateRef.current;
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, code } : t,
        ),
      };
      if (apply) {
        applyTracks(next);
      } else {
        // Persist draft only — keep rawCode and the running pattern untouched.
        setDawState(next);
      }
    },
    [applyTracks],
  );

  const setRawCode = React.useCallback(
    (code: string) => {
      // hotEvaluate sets the editor doc and re-evaluates if playing. The
      // resulting onStateChange echo flows through loadState and re-parses
      // tracks, so DAW state stays in sync.
      service.hotEvaluate(code);
    },
    [service],
  );

  const setTempo = React.useCallback(
    (tempo: Tempo) => {
      const prev = dawStateRef.current;
      const newPreamble = withTempo(prev.preamble, tempo);
      if (newPreamble === prev.preamble) return;
      const next = { ...prev, preamble: newPreamble };
      if (next.isMultiTrack && next.tracks.length > 0) {
        applyTracks(next);
      } else {
        // No labelled tracks yet — just stash the preamble locally and push
        // it as raw code so the change is reflected if/when the user adds
        // tracks or starts playing.
        setDawState(next);
        service.hotEvaluate(newPreamble);
      }
    },
    [applyTracks, service],
  );

  const value = React.useMemo<TrackContextValue>(
    () => ({
      dawState,
      setMute,
      setSolo,
      setVolume,
      addNewTrack,
      updateTrackCode,
      setRawCode,
      setTempo,
    }),
    [
      dawState,
      setMute,
      setSolo,
      setVolume,
      addNewTrack,
      updateTrackCode,
      setRawCode,
      setTempo,
    ],
  );

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

export function useTracks(): TrackContextValue {
  const ctx = React.useContext(TrackContext);
  if (!ctx) throw new Error("useTracks must be used within TrackProvider");
  return ctx;
}
