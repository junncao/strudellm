"use client";

import { ApiKeyMissing } from "@/components/api-key-missing";
import { LoadingContextProvider } from "@/components/loading/context";
import { FloatingLoader } from "@/components/loading/floating-loader";
import { components } from "@/lib/tambo";
import { tagGameTools } from "./_lib/taggame-tools";
import { useSession } from "@/lib/auth-client";
import { StrudelProvider } from "@/strudel/context/strudel-provider";
import { TrackProvider } from "@/strudel/context/track-context";
import { StrudelService } from "@/strudel/lib/service";
import { TamboProvider } from "@tambo-ai/react";
import * as React from "react";
import { TagGameShell } from "./_components/taggame-shell";

const ANON_CONTEXT_KEY_STORAGE = "taggame-ai-context-key";

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

const bestEffortNonSecureId = (): string => {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
};

const getOrCreateAnonymousContextKey = (): string | null => {
  if (typeof window === "undefined") return null;
  const existing = safeLocalStorageGetItem(ANON_CONTEXT_KEY_STORAGE);
  if (existing) return existing;

  const next = `taggame-ai-anon-${bestEffortNonSecureId()}`;
  safeLocalStorageSetItem(ANON_CONTEXT_KEY_STORAGE, next);
  return next;
};

function useAuthIdentity() {
  const { data: sessionData, isPending } = useSession();
  const userId = sessionData?.user?.id ?? null;
  const userToken = sessionData?.session?.token ?? null;
  return { isPending, userId, userToken };
}

function useContextKey({
  userId,
  isPending,
}: {
  userId: string | null;
  isPending: boolean;
}):
  | { userKey: string; isReady: true }
  | { userKey: null; isReady: false } {
  const [userKey, setUserKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isPending) return;

    if (userId) {
      setUserKey(`taggame-user-${userId}`);
      return;
    }

    setUserKey(getOrCreateAnonymousContextKey());
  }, [isPending, userId]);

  if (userKey) return { userKey, isReady: true };
  return { userKey: null, isReady: false };
}

function useLatchedTrue(value: boolean): boolean {
  const [latched, setLatched] = React.useState(false);
  React.useEffect(() => {
    if (value) setLatched(true);
  }, [value]);
  return latched;
}

const tagGameStrudelContextHelper = () => {
  const service = StrudelService.instance();
  const state = service.getReplState();

  const evalError = state?.evalError;
  const schedulerError = state?.schedulerError;
  let errorMessage: string | null = null;

  if (evalError) {
    errorMessage = typeof evalError === "string" ? evalError : evalError.message;
  } else if (schedulerError) {
    errorMessage =
      typeof schedulerError === "string" ? schedulerError : schedulerError.message;
  }

  return {
    currentCode: state?.code ?? "",
    isPlaying: state?.started ?? false,
    error: errorMessage,
    missingSample: state?.missingSample ?? null,
    instruction: errorMessage
      ? "The current Strudel code has an error. Use updateTagGameRepl with corrected code and keep the loop aligned with the selected tag fusion."
      : null,
  };
};

function TagGameTamboProvider({
  apiKey,
  children,
}: {
  apiKey: string;
  children: React.ReactNode;
}) {
  const { isPending, userId, userToken } = useAuthIdentity();
  const userKeyState = useContextKey({ userId, isPending });
  const everResolved = useLatchedTrue(!isPending);

  if ((isPending && !everResolved) || !userKeyState.isReady) {
    return <FloatingLoader mode="page" forced message="Connecting TagGame…" />;
  }

  return (
    <TamboProvider
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      apiKey={apiKey}
      userToken={userToken ?? undefined}
      userKey={userKeyState.userKey}
      tools={tagGameTools}
      components={components}
      contextHelpers={{
        strudelState: tagGameStrudelContextHelper,
      }}
      autoGenerateThreadName={false}
    >
      {children}
    </TamboProvider>
  );
}

export default function TagGamePage() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  if (!apiKey) {
    return <ApiKeyMissing />;
  }

  return (
    <LoadingContextProvider>
      <StrudelProvider>
        <TrackProvider>
          <TagGameTamboProvider apiKey={apiKey}>
            <TagGameShell />
          </TagGameTamboProvider>
        </TrackProvider>
      </StrudelProvider>
    </LoadingContextProvider>
  );
}
