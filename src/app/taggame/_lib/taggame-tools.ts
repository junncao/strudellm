import { defineTool, type TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { StrudelService } from "@/strudel/lib/service";
import { getActiveTagGameRequestId } from "./taggame-generation-guard";

const service = StrudelService.instance();

function extractFinalStackVoiceNames(code: string): Set<string> {
  const match = code.match(/(?:^|\n)\s*(?:return\s+)?stack\(([\s\S]*?)\)\s*;?\s*$/);
  if (!match) {
    return new Set();
  }

  return new Set(
    match[1]
      .split(",")
      .map((part) => part.trim())
      .filter((part) => /^[a-z][\w]*$/i.test(part)),
  );
}

function normalizeTagGameCode(code: string): string {
  let normalized = code.trim();
  const finalVoiceNames = extractFinalStackVoiceNames(normalized);

  normalized = normalized.replace(
    /^(let|const|var)\s+([a-z][\w]*)\s*=\s*/gm,
    (_match, declaration: string, name: string) => {
      if (finalVoiceNames.has(name)) {
        return `$${name}: `;
      }
      return `${declaration} ${name} = `;
    },
  );

  normalized = normalized.replace(
    /^(?!\$)([a-z][\w]*)\s*=\s*/gm,
    (_match, name: string) => {
      if (finalVoiceNames.has(name)) {
        return `$${name}: `;
      }
      return `const ${name} = `;
    },
  );

  normalized = normalized.replace(/^\s*return\s+stack\([\s\S]*?\)\s*;?\s*$/gm, "");
  normalized = normalized.replace(/^\s*stack\([\s\S]*?\)\s*;?\s*$/gm, "");

  return normalized.trim();
}

export const updateTagGameRepl = defineTool({
  name: "updateTagGameRepl",
  description: `Update the TagGame Strudel REPL with newly generated code.

Rules:
- You MUST pass back the exact requestId provided in the user's latest prompt.
- If success is false, immediately call this tool again with corrected code.
- Return plain JavaScript Strudel code, not $label: track syntax.
- Use assignments like drums = ..., bass = ..., pad = ... and finish with stack(drums, bass, pad).
- Include setCpm(...).
- Prefer dependable Strudel constructs and concise looping sketches.`,
  tool: async ({ code, requestId }) => {
    const activeRequestId = getActiveTagGameRequestId();
    if (!activeRequestId || requestId !== activeRequestId) {
      return {
        success: false,
        error:
          "Superseded request. This requestId is no longer active for TagGame. Wait for the latest prompt and use its exact requestId.",
      };
    }

    await service.init();
    const normalizedCode = normalizeTagGameCode(code);
    const result = await service.updateAndPlay(normalizedCode, { source: "ai" });
    return { ...result, code: normalizedCode };
  },
  inputSchema: z.object({
    requestId: z
      .string()
      .describe("The exact active TagGame requestId from the latest user prompt."),
    code: z.string().describe("The Strudel code to validate and apply."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    code: z.string().optional(),
    error: z.string().optional(),
  }),
});

export const tagGameTools: TamboTool[] = [updateTagGameRepl];
