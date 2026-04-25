"use client";

import { useCallback, useMemo, useState, useEffect } from "react";

const STORAGE_KEY = "strudel-code";
// Bump this version whenever you want to force-reset existing users to the new default
const STORAGE_VERSION_KEY = "strudel-code-version";
const CURRENT_VERSION = "2";

export const INITIAL_DEFAULT_CODE = `// StrudelLM — Classic four-track demo. Hit Play to listen.

setCpm(120/4)

$drums: s("bd ~ sd ~, ~ hh ~ [hh oh]").bank("RolandTR909").gain(0.85)

$bass: note("c2 ~ f1 ~, ~ g1 ~ c2").s("sawtooth").lpf(500).gain(0.65)

$guitar: note("<[c3,e3,g3] [f2,a2,c3] [g2,b2,d3] [c3,e3,g3]>").s("square").gain(0.2).release(0.3)

$piano: note("e4 g4 ~ c5, ~ g4 e4 ~").s("piano").gain(0.3).room(0.3)
`;

export interface SimpleStrudelStorage {
  code: string;
  setCode: (code: string) => void;
  resetCode: () => void;
  isLoaded: boolean;
}

export function useStrudelStorage(): SimpleStrudelStorage {
  const [code, setCodeState] = useState(INITIAL_DEFAULT_CODE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);

      if (storedVersion !== CURRENT_VERSION || !stored) {
        // First visit or stale version — use the new default
        localStorage.setItem(STORAGE_KEY, INITIAL_DEFAULT_CODE);
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
        setCodeState(INITIAL_DEFAULT_CODE);
      } else {
        setCodeState(stored);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
    setIsLoaded(true);
  }, []);

  const setCode = useCallback((newCode: string) => {
    setCodeState(newCode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, newCode);
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      } catch {
        // ignore
      }
    }
  }, []);

  const resetCode = useCallback(() => {
    setCodeState(INITIAL_DEFAULT_CODE);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, INITIAL_DEFAULT_CODE);
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      } catch {
        // ignore
      }
    }
  }, []);

  return useMemo(
    () => ({ code, setCode, resetCode, isLoaded }),
    [code, setCode, resetCode, isLoaded]
  );
}
