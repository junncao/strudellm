"use client";

import * as React from "react";
import {
  type DawState,
  parseTracksFromCode,
  compileTracksToCode,
  addTrack,
} from "@/strudel/lib/track-parser";
import { StrudelService } from "@/strudel/lib/service";

type TrackContextValue = {
  dawState: DawState;
  setMute: (trackId: string, muted: boolean) => void;
  setSolo: (trackId: string) => void;
  setVolume: (trackId: string, volume: number) => void;
  addNewTrack: (name: string) => void;
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
        // For existing tracks, preserve all user-controlled state (muted, soloed, volume).
        // - muted/soloed: user toggle state, never overwritten by code parsing
        // - volume: the "desired" volume when unmuted; gain(0) is injected for mute/solo
        //   in compileTracksToCode, so the parsed gain would be 0 — we don't want that
        //   to overwrite the user's actual volume setting.
        // New tracks from AI get their parsed initial values (no existing entry).
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
      const prev = dawStateRef.current;
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === trackId ? { ...t, soloed: !t.soloed } : t
        ),
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

  const value = React.useMemo<TrackContextValue>(
    () => ({ dawState, setMute, setSolo, setVolume, addNewTrack }),
    [dawState, setMute, setSolo, setVolume, addNewTrack]
  );

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

export function useTracks(): TrackContextValue {
  const ctx = React.useContext(TrackContext);
  if (!ctx) throw new Error("useTracks must be used within TrackProvider");
  return ctx;
}
