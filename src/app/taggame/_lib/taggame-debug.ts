"use client";

import * as React from "react";

export type TagGameDebugLevel = "info" | "success" | "warn" | "error";

export type TagGameDebugEntry = {
  id: string;
  at: number;
  level: TagGameDebugLevel;
  step: string;
  message: string;
  detail?: string;
};

const MAX_LOGS = 120;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

let logs: TagGameDebugEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  queueMicrotask(() => {
    listeners.forEach((listener) => listener());
  });
}

function bestEffortLogId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function isTagGameDebugEnabled() {
  if (typeof window === "undefined") return false;
  return process.env.NODE_ENV === "development" || LOCAL_HOSTS.has(window.location.hostname);
}

export function addTagGameDebugLog({
  level = "info",
  step,
  message,
  detail,
}: {
  level?: TagGameDebugLevel;
  step: string;
  message: string;
  detail?: string;
}) {
  const entry: TagGameDebugEntry = {
    id: bestEffortLogId(),
    at: Date.now(),
    level,
    step,
    message,
    detail,
  };

  logs = [...logs.slice(-(MAX_LOGS - 1)), entry];

  if (process.env.NODE_ENV === "development") {
    const parts = [`[taggame/${level}]`, step, message];
    if (detail) {
      parts.push(detail);
    }
    console.log(parts.join(" | "));
  }

  emit();
  return entry;
}

export function clearTagGameDebugLogs() {
  logs = [];
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return logs;
}

export function useTagGameDebugLogs() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
