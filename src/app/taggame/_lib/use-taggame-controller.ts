"use client";

import { useStrudel } from "@/strudel/context/strudel-provider";
import { DEFAULT_CODE } from "@/strudel/lib/service";
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import * as React from "react";
import { buildTagGamePrompt } from "./build-taggame-prompt";
import {
  type TagGameContextFile,
  type TagGameContextSource,
} from "./taggame-context-file";
import {
  addTagGameDebugLog,
  clearTagGameDebugLogs,
  isTagGameDebugEnabled,
} from "./taggame-debug";
import {
  createCustomTag,
  getTagGameGenesByIds,
  getTagGameStylesByIds,
  getTagGameTagsByIds,
  type TagGameCustomTag,
} from "./taggame-tags";
import { setActiveTagGameRequestId } from "./taggame-generation-guard";

type PendingSubmission = {
  prompt: string;
  requestId: string;
  resetVersion: number;
  sequence: number;
};

function formatSelectionSummary(styles: string[], genes: string[], custom: string[]) {
  if (styles.length === 0 && genes.length === 0 && custom.length === 0) {
    return "";
  }

  const stylePart = styles.length > 0 ? styles.join(" · ") : "No style tag";
  const genePart = genes.length > 0 ? genes.slice(0, 4).join(" · ") : "No fine-grain genes";
  const geneOverflow = genes.length > 4 ? ` +${genes.length - 4} more` : "";
  const customPart = custom.length > 0
    ? ` / Custom: ${custom.slice(0, 2).join(" · ")}${custom.length > 2 ? ` +${custom.length - 2} more` : ""}`
    : "";
  return `${stylePart} / ${genePart}${geneOverflow}${customPart}`;
}

function makeRequestId() {
  try {
    return `taggame-${crypto.randomUUID()}`;
  } catch {
    return `taggame-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const TAGGAME_STARTER_CODE = `setCpm(110/4)
$silence: s("~")`;

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unknown error";
}

function serializeDetail(detail: unknown) {
  if (detail == null) return undefined;
  if (typeof detail === "string") return detail;

  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    return String(detail);
  }
}

async function resolveTagGameContextSource(contextSource: TagGameContextSource | null): Promise<TagGameContextFile | null> {
  if (!contextSource) {
    return null;
  }

  if (contextSource.kind === "upload") {
    return contextSource.file;
  }

  const response = await fetch("/api/taggame/debug-context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: contextSource.path }),
  });

  const payload = await response.json().catch(() => null) as
    | { error?: string; contextFile?: TagGameContextFile }
    | null;

  if (!response.ok || !payload?.contextFile) {
    throw new Error(payload?.error || "Failed to read local debug context file.");
  }

  return payload.contextFile;
}

export function useTagGameController() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [customTags, setCustomTags] = React.useState<TagGameCustomTag[]>([]);
  const [customInput, setCustomInput] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = React.useState("");
  const [pendingSubmission, setPendingSubmission] = React.useState<PendingSubmission | null>(null);
  const [statusStepLabel, setStatusStepLabel] = React.useState("Step 1/4 Pick bubbles");
  const [activeCookRequestId, setActiveCookRequestIdState] = React.useState<string | null>(null);
  const [contextSource, setContextSource] = React.useState<TagGameContextSource | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  const { value, setValue, submit, isDisabled, isPending } = useTamboThreadInput();
  const { startNewThread, streamingState, currentThreadId } = useTambo();
  const {
    code,
    isPlaying,
    isReady,
    stop,
    reset,
    setCode,
    clearError,
    error,
    revertNotification,
    clearRevertNotification,
    setIsAiUpdating,
  } = useStrudel();

  const customTagMap = React.useMemo(
    () => new Map(customTags.map((tag) => [tag.id, tag])),
    [customTags],
  );

  const selectedTags = React.useMemo(
    () => selectedIds.flatMap((id) => customTagMap.get(id) ?? getTagGameTagsByIds([id])),
    [customTagMap, selectedIds],
  );
  const selectedStyles = React.useMemo(() => getTagGameStylesByIds(selectedIds), [selectedIds]);
  const selectedGenes = React.useMemo(() => getTagGameGenesByIds(selectedIds), [selectedIds]);
  const selectedCustomTags = React.useMemo(
    () => selectedIds.flatMap((id) => {
      const tag = customTagMap.get(id);
      return tag ? [tag] : [];
    }),
    [customTagMap, selectedIds],
  );

  const summary = React.useMemo(
    () => formatSelectionSummary(
      selectedStyles.map((item) => item.label),
      selectedGenes.map((item) => item.name),
      selectedCustomTags.map((item) => item.label),
    ),
    [selectedCustomTags, selectedGenes, selectedStyles],
  );

  const selectionSignature = React.useMemo(() => selectedIds.join("|"), [selectedIds]);

  const latestRequestIdRef = React.useRef<string | null>(null);
  const generationSequenceRef = React.useRef(0);
  const resetVersionRef = React.useRef(0);
  const lastCookedSignatureRef = React.useRef<string>("");
  const activeCookRequestIdRef = React.useRef<string | null>(null);
  const submitRef = React.useRef(submit);
  const setValueRef = React.useRef(setValue);
  const clearErrorRef = React.useRef(clearError);
  const clearRevertNotificationRef = React.useRef(clearRevertNotification);
  const submittingRequestIdRef = React.useRef<string | null>(null);
  const hasInitializedThreadRef = React.useRef(false);
  const previousStreamingStatusRef = React.useRef<string | null>(null);
  const previousThreadIdRef = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    clearTagGameDebugLogs();
    latestRequestIdRef.current = null;
    generationSequenceRef.current = 0;
    resetVersionRef.current = 0;
    lastCookedSignatureRef.current = "";
    activeCookRequestIdRef.current = null;
    submittingRequestIdRef.current = null;
    hasInitializedThreadRef.current = false;
    previousStreamingStatusRef.current = null;
    previousThreadIdRef.current = null;
    setActiveTagGameRequestId(null);
    setSelectedIds([]);
    setCustomTags([]);
    setCustomInput("");
    setPendingSummary("");
    setPendingSubmission(null);
    setSubmitError(null);
    setActiveCookRequestIdState(null);
    setStatusStepLabel("Step 1/4 Pick bubbles");
    setValueRef.current("");
    setIsHydrated(true);
  }, []);

  const setActiveCookRequestId = React.useCallback((requestId: string | null) => {
    activeCookRequestIdRef.current = requestId;
    setActiveCookRequestIdState(requestId);
  }, []);

  const debug = React.useCallback(
    (args: {
      detail?: unknown;
      level?: "info" | "success" | "warn" | "error";
      message: string;
      step: string;
    }) => {
      addTagGameDebugLog({
        level: args.level,
        step: args.step,
        message: args.message,
        detail: serializeDetail(args.detail),
      });
    },
    [],
  );

  const invalidateCurrentCook = React.useCallback((reason?: string) => {
    generationSequenceRef.current += 1;
    latestRequestIdRef.current = null;
    setActiveTagGameRequestId(null);
    setPendingSubmission(null);
    setActiveCookRequestId(null);
    setSubmitError(null);
    clearRevertNotificationRef.current();
    clearErrorRef.current();

    if (reason) {
      debug({
        step: "cook",
        level: "warn",
        message: reason,
        detail: {
          currentThreadId,
          streamingStatus: streamingState.status,
        },
      });
    }
  }, [clearErrorRef, clearRevertNotificationRef, currentThreadId, debug, setActiveCookRequestId, streamingState.status]);

  const resetGenerationState = React.useCallback(() => {
    invalidateCurrentCook();
    setPendingSummary("");
    stop();
    setValueRef.current("");
  }, [invalidateCurrentCook, stop]);

  React.useLayoutEffect(() => {
    if (!isHydrated || hasInitializedThreadRef.current) return;
    hasInitializedThreadRef.current = true;
    stop();
    clearErrorRef.current();
    clearRevertNotificationRef.current();
    setValueRef.current("");
    const starterCode = TAGGAME_STARTER_CODE;
    reset();
    setCode(starterCode);
    const initialThreadId = startNewThread();
    debug({
      step: "thread",
      message: "Initialized fresh TagGame thread.",
      detail: { threadId: initialThreadId, starterCode },
    });
  }, [debug, isHydrated, reset, setCode, startNewThread, stop]);

  React.useEffect(() => {
    submitRef.current = submit;
    setValueRef.current = setValue;
    clearErrorRef.current = clearError;
    clearRevertNotificationRef.current = clearRevertNotification;
  }, [clearError, clearRevertNotification, setValue, submit]);

  React.useEffect(() => {
    setIsAiUpdating(activeCookRequestId !== null || pendingSubmission !== null);
    return () => setIsAiUpdating(false);
  }, [activeCookRequestId, pendingSubmission, setIsAiUpdating]);

  React.useEffect(() => {
    if (!isReady) return;
    if (code !== DEFAULT_CODE) return;
    setCode(TAGGAME_STARTER_CODE);
  }, [code, isReady, setCode]);

  React.useEffect(() => {
    if (previousStreamingStatusRef.current === streamingState.status) return;
    previousStreamingStatusRef.current = streamingState.status;

    debug({
      step: "stream",
      message: `Streaming state is ${streamingState.status}.`,
      detail: { status: streamingState.status, threadId: currentThreadId },
      level: streamingState.status === "idle" ? "success" : "info",
    });

    if (!activeCookRequestIdRef.current) {
      return;
    }

    if (streamingState.status === "waiting") {
      setStatusStepLabel("Step 4/4 AI is thinking");
      return;
    }

    if (streamingState.status === "streaming") {
      setStatusStepLabel("Step 4/4 AI is applying the loop");
    }
  }, [currentThreadId, debug, streamingState.status]);

  React.useEffect(() => {
    if (previousThreadIdRef.current === currentThreadId) return;
    previousThreadIdRef.current = currentThreadId;
    debug({
      step: "thread",
      message: "Switched active TagGame thread.",
      detail: { threadId: currentThreadId },
    });
  }, [currentThreadId, debug]);

  React.useEffect(() => {
    if (!revertNotification) return;
    setActiveCookRequestId(null);
    setStatusStepLabel("Cook failed, adjust the bubbles and try again");
    debug({
      step: "playback",
      level: "warn",
      message: revertNotification.message,
    });
  }, [debug, revertNotification, setActiveCookRequestId]);

  React.useEffect(() => {
    if (!error) return;
    setActiveCookRequestId(null);
    setStatusStepLabel("Cook failed, see the error details");
    debug({
      step: "playback",
      level: "error",
      message: "Strudel reported an error.",
      detail: typeof error === "string" ? error : error.message,
    });
  }, [debug, error, setActiveCookRequestId]);

  React.useEffect(() => {
    if (selectedIds.length === 0) {
      lastCookedSignatureRef.current = "";
      resetGenerationState();
      setStatusStepLabel("Step 1/4 Pick bubbles");
      return;
    }

    setPendingSummary(summary);
    setSubmitError(null);

    if (
      lastCookedSignatureRef.current
      && lastCookedSignatureRef.current !== selectionSignature
    ) {
      invalidateCurrentCook("Selection changed during cooking, Cook is ready again.");
      lastCookedSignatureRef.current = "";
      if (isPlaying) {
        stop();
      }
      setStatusStepLabel("Step 1/4 Cluster changed, click Cook again");
      return;
    }

    if (activeCookRequestIdRef.current) {
      setStatusStepLabel("Cooking the current cluster");
      return;
    }

    const hasGenerationError = Boolean(
      submitError
      || revertNotification?.message
      || error,
    );

    if (hasGenerationError) {
      return;
    }

    setStatusStepLabel(
      isPlaying && lastCookedSignatureRef.current === selectionSignature
        ? "Cook complete, loop is live"
        : "Step 1/4 Click Cook in the core",
    );
  }, [
    error,
    invalidateCurrentCook,
    isPlaying,
    resetGenerationState,
    revertNotification,
    selectedIds.length,
    selectionSignature,
    stop,
    submitError,
    summary,
  ]);

  const cookCluster = React.useCallback(() => {
    if (selectedIds.length === 0 || (isDisabled && !isPending)) {
      return;
    }

    if (
      activeCookRequestIdRef.current
      || pendingSubmission !== null
      || streamingState.status !== "idle"
    ) {
      resetVersionRef.current += 1;
      invalidateCurrentCook("Manual re-cook requested, forcing a fresh refresh.");
    }

    generationSequenceRef.current += 1;
    const sequence = generationSequenceRef.current;
    const requestId = makeRequestId();
    const resetVersion = resetVersionRef.current;

    latestRequestIdRef.current = requestId;
    lastCookedSignatureRef.current = selectionSignature;
    setActiveCookRequestId(requestId);
    setPendingSummary(summary);
    setSubmitError(null);
    setStatusStepLabel(contextSource?.kind === "path" ? "Step 2/4 Opening local debug file" : "Step 2/4 Opening a fresh cooking thread");

    void (async () => {
      try {
        const resolvedContextFile = await resolveTagGameContextSource(contextSource);

        if (
          latestRequestIdRef.current !== requestId
          || generationSequenceRef.current !== sequence
          || resetVersionRef.current !== resetVersion
        ) {
          return;
        }

        const prompt = buildTagGamePrompt({
          requestId,
          styles: selectedStyles,
          genes: selectedGenes,
          customTags: selectedCustomTags,
          contextFile: resolvedContextFile,
        });
        const nextThreadId = startNewThread();

        debug({
          step: "cook",
          level: "info",
          message: "Cook button pressed, preparing a fresh fusion run.",
          detail: {
            nextThreadId,
            requestId,
            selectionCount: selectedIds.length,
            styles: selectedStyles.map((item) => item.id),
            genes: selectedGenes.map((item) => item.id),
            custom: selectedCustomTags.map((item) => item.label),
            contextSource: contextSource?.kind === "path"
              ? { kind: "path", path: contextSource.path }
              : resolvedContextFile
                ? {
                    kind: "upload",
                    fileName: resolvedContextFile.fileName,
                    chars: resolvedContextFile.content.length,
                    truncated: resolvedContextFile.truncated,
                  }
                : null,
          },
        });

        setStatusStepLabel("Step 2/4 Opening a fresh cooking thread");
        setPendingSubmission({
          prompt,
          requestId,
          resetVersion,
          sequence,
        });
      } catch (nextError) {
        const message = formatError(nextError);
        if (
          latestRequestIdRef.current === requestId
          && generationSequenceRef.current === sequence
          && resetVersionRef.current === resetVersion
        ) {
          setSubmitError(message);
          setStatusStepLabel("Cook failed, see the error details");
        }
        debug({
          step: "context",
          level: "error",
          message: "Failed to resolve debug context before cooking.",
          detail: nextError,
        });
        if (activeCookRequestIdRef.current === requestId) {
          setActiveCookRequestId(null);
        }
      }
    })();
  }, [
    contextSource,
    debug,
    invalidateCurrentCook,
    isDisabled,
    pendingSubmission,
    selectedCustomTags,
    selectedGenes,
    selectedIds.length,
    selectedStyles,
    selectionSignature,
    setActiveCookRequestId,
    startNewThread,
    streamingState.status,
    summary,
    isPending,
  ]);

  React.useEffect(() => {
    if (!pendingSubmission) return;
    if (pendingSubmission.resetVersion !== resetVersionRef.current) return;
    if (pendingSubmission.sequence !== generationSequenceRef.current) return;
    if (isDisabled) return;

    const { prompt, requestId, sequence, resetVersion } = pendingSubmission;

    if (currentThreadId === "placeholder" && value !== prompt) {
      setStatusStepLabel("Step 3/4 Packing the prompt");
      setValueRef.current(prompt);
      debug({
        step: "submit",
        message: "Queued the fusion prompt on the placeholder thread.",
        detail: {
          requestId,
          threadId: currentThreadId,
          promptPreview: prompt.slice(0, 280),
        },
      });
      return;
    }

    if (currentThreadId !== "placeholder" && value !== prompt) return;
    if (submittingRequestIdRef.current === requestId) return;

    submittingRequestIdRef.current = requestId;

    void (async () => {
      try {
        if (
          latestRequestIdRef.current !== requestId
          || generationSequenceRef.current !== sequence
          || resetVersionRef.current !== resetVersion
        ) {
          debug({
            step: "submit",
            level: "warn",
            message: "Abandoned a stale fusion right before submit.",
            detail: { requestId, sequence, currentSequence: generationSequenceRef.current },
          });
          return;
        }

        setActiveTagGameRequestId(requestId);
        clearRevertNotificationRef.current();
        clearErrorRef.current();
        setStatusStepLabel("Step 4/4 Sending the recipe to Tambo");
        debug({
          step: "submit",
          message: "Submitting fusion prompt to Tambo.",
          detail: {
            requestId,
            threadId: currentThreadId,
            promptPreview: prompt.slice(0, 280),
          },
        });

        const result = await submitRef.current({
          toolChoice: { name: "updateTagGameRepl" },
          debug: isTagGameDebugEnabled(),
        });

        debug({
          step: "submit",
          level: "success",
          message: "Tambo accepted the fusion request.",
          detail: { requestId, result },
        });
      } catch (nextError) {
        const message = formatError(nextError);
        if (
          latestRequestIdRef.current === requestId
          && generationSequenceRef.current === sequence
          && resetVersionRef.current === resetVersion
        ) {
          setSubmitError(message);
        }
        setStatusStepLabel("Cook failed, see the error details");
        debug({
          step: "submit",
          level: "error",
          message: "Fusion submit failed.",
          detail: nextError,
        });
      } finally {
        if (submittingRequestIdRef.current === requestId) {
          submittingRequestIdRef.current = null;
        }
        if (activeCookRequestIdRef.current === requestId) {
          setActiveCookRequestId(null);
        }
        setPendingSubmission((current) => current?.requestId === requestId ? null : current);
      }
    })();
  }, [currentThreadId, debug, isDisabled, pendingSubmission, setActiveCookRequestId, value]);

  const toggleTag = React.useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      if (current.includes(id) && customTagMap.has(id)) {
        setCustomTags((tags) => tags.filter((tag) => tag.id !== id));
      }

      debug({
        step: "selection",
        message: current.includes(id) ? "Removed a bubble from the cluster." : "Added a bubble to the cluster.",
        detail: { id, nextSelection: next },
      });

      return next;
    });
  }, [customTagMap, debug]);

  const addCustomTag = React.useCallback(() => {
    const value = customInput.trim();
    if (!value) return;

    const nextTag = createCustomTag(value);
    setCustomTags((current) => [...current, nextTag]);
    setSelectedIds((current) => [...current, nextTag.id]);
    setCustomInput("");

    debug({
      step: "custom",
      level: "success",
      message: "Added a custom bubble.",
      detail: { id: nextTag.id, label: nextTag.label },
    });
  }, [customInput, debug]);

  const clearSelection = React.useCallback(() => {
    clearTagGameDebugLogs();
    resetVersionRef.current += 1;
    lastCookedSignatureRef.current = "";
    resetGenerationState();
    setSelectedIds([]);
    setCustomTags([]);
    setCustomInput("");
    setStatusStepLabel("Step 1/4 Pick bubbles");
    const threadId = startNewThread();

    debug({
      step: "reset",
      level: "success",
      message: "Reset the cluster and started a fresh empty thread.",
      detail: { threadId, resetVersion: resetVersionRef.current },
    });
  }, [debug, resetGenerationState, startNewThread]);

  const generationError = submitError
    ?? revertNotification?.message
    ?? (error ? (typeof error === "string" ? error : error.message) : null);

  const isGenerating = activeCookRequestId !== null || pendingSubmission !== null;
  const canCook = selectedIds.length > 0 && (!isDisabled || isPending);

  return {
    selectedIds,
    selectedTags,
    selectedStyles,
    selectedGenes,
    selectedCustomTags,
    customTags,
    customInput,
    setCustomInput,
    addCustomTag,
    toggleTag,
    clearSelection,
    cookCluster,
    canCook,
    isGenerating,
    generationError,
    playing: isPlaying,
    summary,
    pendingSummary,
    shouldShowGlobalLoader: !isReady,
    statusStepLabel,
    contextSource,
    setContextSource,
  };
}
