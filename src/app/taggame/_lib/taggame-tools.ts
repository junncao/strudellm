import { defineTool, type TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { StrudelService } from "@/strudel/lib/service";
import { extractSampleNames, validateSamples } from "@/strudel/tools/validateAndUpdateRepl";
import { getActiveTagGameRequestId } from "./taggame-generation-guard";

const service = StrudelService.instance();

function normalizeTagGameCode(code: string): string {
  return code.trim();
}

export const updateTagGameRepl = defineTool({
  name: "updateTagGameRepl",
  description: `Update the TagGame Strudel REPL with newly generated code.

Rules:
- You MUST pass back the exact requestId provided in the user's latest prompt.
- If success is false, immediately call this tool again with corrected code.
- Return final Strudel code in multi-track $label: format.
- Put global setup like setCpm(...) before the first $track line.
- Use 2 to 5 named tracks such as $drums:, $bass:, $chords:, $lead:, $pad:.
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
    const sampleNames = extractSampleNames(normalizedCode);
    if (sampleNames.length > 0) {
      const { missing, suggestions } = await validateSamples(sampleNames);
      if (missing.length > 0) {
        let error = `Error: Unknown sample(s): ${missing.join(", ")}.`;

        for (const [sample, similar] of suggestions) {
          if (similar.length > 0) {
            error += `\n  - "${sample}" - did you mean: ${similar.join(", ")}?`;
          }
        }

        error += "\n\nUse dependable built-in sounds or retry with valid sample names.";
        return { success: false, error, code: normalizedCode };
      }
    }

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
