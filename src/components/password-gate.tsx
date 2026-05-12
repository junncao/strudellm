"use client";

import * as React from "react";

const PRIVATE_BETA_ACCESS_STORAGE_KEY = "lmdj-private-beta-access-v1";
const PRIVATE_BETA_ACCESS_STORAGE_VALUE = "granted";
const PRIVATE_BETA_PASSWORD = "3333";

const safeLocalStorageGetItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSetItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {}
};

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<"checking" | "locked" | "unlocked">(
    "checking",
  );
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const hasAccess =
      safeLocalStorageGetItem(PRIVATE_BETA_ACCESS_STORAGE_KEY) ===
      PRIVATE_BETA_ACCESS_STORAGE_VALUE;
    setStatus(hasAccess ? "unlocked" : "locked");
  }, []);

  React.useEffect(() => {
    if (status === "locked") {
      inputRef.current?.focus();
    }
  }, [status]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password === PRIVATE_BETA_PASSWORD) {
      safeLocalStorageSetItem(
        PRIVATE_BETA_ACCESS_STORAGE_KEY,
        PRIVATE_BETA_ACCESS_STORAGE_VALUE,
      );
      setError(null);
      setPassword("");
      setStatus("unlocked");
      return;
    }

    setError("Incorrect password. Please try again.");
  };

  if (status === "unlocked") {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-6 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            LMDJ
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Private Beta Access
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            LMDJ is currently in private beta and is not yet open to the public.
            Please enter the access password to continue.
          </p>
        </div>

        {status === "checking" ? (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Checking access…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="private-beta-password"
                className="block text-sm font-medium text-foreground"
              >
                Access password
              </label>
              <input
                ref={inputRef}
                id="private-beta-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Enter password"
                autoComplete="off"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                This password gate is only for limited internal beta access.
              </p>
            </div>

            {error && (
              <div
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Enter LMDJ
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
