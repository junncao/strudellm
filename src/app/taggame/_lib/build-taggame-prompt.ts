import type { TagGameContextFile } from "./taggame-context-file";
import type { TagGameCustomTag, TagGameGeneTag, TagGameStyleTag } from "./taggame-tags";

function formatStyles(styles: TagGameStyleTag[]) {
  if (styles.length === 0) {
    return "- No explicit style tags selected. Infer a coherent style from the detailed music-gene constraints while keeping the loop immediately listenable.";
  }

  return styles
    .map(
      (style) =>
        `- ${style.label}: ${style.promptCue} Tempo hint: ${style.tempoHint}. Palette hint: ${style.paletteHint}. Energy hint: ${style.energyHint}. Description: ${style.description}`,
    )
    .join("\n");
}

function formatGenes(genes: TagGameGeneTag[]) {
  if (genes.length === 0) {
    return "- No fine-grained music genes selected. Keep the loop simple, style-faithful, and playable.";
  }

  return genes
    .map(
      (gene) =>
        `- ${gene.name} (${gene.category}, ${gene.type}): ${gene.promptCue} Definition: ${gene.definition}. Effect: ${gene.effect}.`,
    )
    .join("\n");
}

function formatCustomTags(customTags: TagGameCustomTag[]) {
  if (customTags.length === 0) {
    return "- No direct custom instructions selected.";
  }

  return customTags
    .map(
      (tag) =>
        `- ${tag.label}: Treat this as a direct user-authored musical instruction. Prioritize it unless it would make the Strudel invalid or clearly contradict a more specific structural constraint.`,
    )
    .join("\n");
}

function formatContextFile(contextFile: TagGameContextFile | null | undefined) {
  if (!contextFile) {
    return "- No extra local context file loaded.";
  }

  return `- File name: ${contextFile.fileName}
- Loaded at: ${new Date(contextFile.loadedAt).toISOString()}
- Length used in prompt: ${contextFile.content.length} chars${contextFile.truncated ? ` (truncated from ${contextFile.originalLength})` : ""}
- Treat the content below as high-priority local project context for this generation. Use it to improve musical specificity, but do not quote it unless needed.

${contextFile.content}`;
}

function formatReferenceSketches(styles: TagGameStyleTag[], genes: TagGameGeneTag[]) {
  const snippets: string[] = [];

  if (styles.some((style) => style.id === "house")) {
    snippets.push(`House reference:
setCpm(124/4)
drums = s("bd ~ bd ~, ~ hh ~ hh, ~ sd ~ ~, ~ ~ cp ~").bank("RolandTR909")
bass = note("c2 ~ c2 ~ g1 ~ a1 ~").s("sawtooth").lpf(520)
chords = note("<[c4,e4,g4,b4] [a3,c4,e4,g4]>").s("gm_epiano1").gain(0.34).room(0.15)
stack(drums, bass, chords)`);
  }

  if (styles.some((style) => style.id === "uk-garage")) {
    snippets.push(`UK garage reference:
setCpm(132/4)
drums = s("bd ~ ~ bd, ~ sd ~ ~, hh [~ hh] hh ~, ~ ~ cp ~").bank("RolandTR909")
bass = note("c2 ~ eb2 ~ g1 ~ bb1 ~").s("triangle").lpf(430)
chords = note("<[c4,eb4,g4,bb4] [bb3,d4,f4,a4]>").s("gm_epiano1").gain(0.28).room(0.3)
stack(drums, bass, chords)`);
  }

  if (styles.some((style) => style.id === "ambient")) {
    snippets.push(`Ambient reference:
setCpm(80/4)
pad = note("<[c4,eb4,g4] [ab3,c4,eb4]>").s("gm_pad_2_warm").gain(0.28).room(0.7).release(0.8)
texture = note("c5 ~ g4 ~").s("gm_voice_oohs").gain(0.18).room(0.9)
sub = note("c2 ~ ~ ~").s("sine").gain(0.22)
stack(pad, texture, sub)`);
  }

  if (genes.some((gene) => gene.id === "broken-beat")) {
    snippets.push(`Broken beat reference:
drums = s("bd ~ ~ sd, ~ hh [hh ~] ~, ~ cp ~ ~, bd ~ ~ ~").bank("RolandTR909")`);
  }

  if (genes.some((gene) => gene.id === "four-on-floor-kick")) {
    snippets.push(`4/4 kick reference:
drums = s("bd bd bd bd, ~ hh ~ hh, ~ sd ~ ~, ~ ~ cp ~").bank("RolandTR909")`);
  }

  if (genes.some((gene) => gene.id === "half-time-snare")) {
    snippets.push(`Half-time snare reference:
drums = s("bd ~ ~ ~, ~ ~ sd ~, hh ~ hh ~, ~ ~ ~ cp").bank("RolandTR909")`);
  }

  if (genes.some((gene) => gene.id === "swing")) {
    snippets.push(`Swing reference:
hats = s("hh hh hh hh").bank("RolandTR909").swingBy(0.18, 4)`);
  }

  if (genes.some((gene) => gene.id === "shuffle")) {
    snippets.push(`Shuffle reference:
hats = s("hh [hh hh] hh [hh hh]").bank("RolandTR909").swingBy(0.24, 4)`);
  }

  if (genes.some((gene) => gene.id === "sub-bass")) {
    snippets.push(`Sub bass reference:
bass = note("c2 ~ c2 ~, ~ g1 ~ bb1").s("sine").gain(0.42)`);
  }

  if (genes.some((gene) => gene.id === "acid-bass" || gene.id === "acid-tone")) {
    snippets.push(`Acid reference:
bass = note("c2 eb2 g2 bb2").s("sawtooth").lpf("<320 900 500 1200>").resonance(0.72)`);
  }

  if (genes.some((gene) => gene.id === "jazzy-chord")) {
    snippets.push(`Jazzy chord reference:
chords = note("<[c4,e4,g4,b4] [a3,c4,e4,g4] [d4,f4,a4,c5]>").s("gm_epiano1").gain(0.32).room(0.22)`);
  }

  if (genes.some((gene) => gene.id === "minor-mood")) {
    snippets.push(`Minor mood reference:
chords = note("<[c4,eb4,g4] [ab3,c4,eb4] [bb3,d4,f4]>").s("gm_epiano1").gain(0.28)`);
  }

  if (genes.some((gene) => gene.id === "bright-major")) {
    snippets.push(`Bright major reference:
chords = note("<[c4,e4,g4] [f4,a4,c5] [g4,b4,d5]>").s("gm_epiano1").gain(0.28)`);
  }

  if (genes.some((gene) => gene.id === "pad-wash")) {
    snippets.push(`Pad wash reference:
pad = note("<[c4,eb4,g4] [bb3,d4,f4]>").s("gm_pad_2_warm").gain(0.24).room(0.8).release(0.7)`);
  }

  if (genes.some((gene) => gene.id === "dusty-drums")) {
    snippets.push(`Dusty drums reference:
drums = s("bd ~ sd ~, hh ~ hh ~").bank("RolandTR909").lpf(900).gain(0.78)`);
  }

  if (genes.some((gene) => gene.id === "crispy-hats")) {
    snippets.push(`Crispy hats reference:
hats = s("~ hh ~ hh, ~ [hh hh] ~ oh").bank("RolandTR909").hpf(7000).gain(0.42)`);
  }

  if (genes.some((gene) => gene.id === "hypnotic-loop")) {
    snippets.push(`Hypnotic loop reference:
lead = note("c4 ~ eb4 ~ g4 ~ eb4 ~").s("triangle").gain(0.2)`);
  }

  if (genes.some((gene) => gene.id === "micro-variation")) {
    snippets.push(`Micro variation reference:
perc = s("cp ~ ~ cp?").bank("RolandTR909").gain(0.3)`);
  }

  if (genes.some((gene) => gene.id === "stabs")) {
    snippets.push(`Stabs reference:
stab = note("<[c5,e5,g5] ~ [bb4,d5,f5] ~>").s("gm_synth_brass_1").gain(0.24)`);
  }

  if (snippets.length === 0) {
    return "- No direct reference sketches selected. Write a concise, stable multi-track loop that matches the tags.";
  }

  return snippets.map((snippet) => `- ${snippet}`).join("\n\n");
}

export function buildTagGamePrompt({
  requestId,
  styles,
  genes,
  customTags,
  contextFile,
}: {
  requestId: string;
  styles: TagGameStyleTag[];
  genes: TagGameGeneTag[];
  customTags: TagGameCustomTag[];
  contextFile?: TagGameContextFile | null;
}) {
  const styleSection = formatStyles(styles);
  const geneSection = formatGenes(genes);
  const customSection = formatCustomTags(customTags);
  const contextFileSection = formatContextFile(contextFile);
  const referenceSection = formatReferenceSketches(styles, genes);

  return `You are generating music for an interactive tag-combination game.

The selected tags describe the current musical fusion. You must use the client tool updateTagGameRepl to apply playable Strudel code.

Active requestId: ${requestId}

Tool contract:
- You MUST call updateTagGameRepl.
- You MUST pass the exact requestId above with the tool call.
- If the tool returns success: false, immediately call updateTagGameRepl again with corrected code.
- Return no prose outside the tool call.

Generation policy:
- Only the latest request matters. If you infer a newer combination exists or the tool says this request is superseded, abandon this attempt and align to the newest requestId.
- Treat selected style tags as macro guidance, gene tags as concrete structural constraints, and custom tags as direct user steering.
- Use the reference sketches below as quality anchors, not as templates to copy blindly.
- Some reference sketches use compact variable + stack form. Convert them into final $track format in your answer.
- Merge multiple references into one coherent loop and keep the result compact, musical, and production-like.
- Prefer stable Strudel syntax that this project can evaluate successfully.
- Return final code in multi-track labeled-statement format using $track: syntax.
- Do not end with stack(...). Each audible voice should be its own $track.

Hard requirements for the code:
- The code must be valid Strudel.
- Include setCpm(...).
- Put global setup before the first $track line.
- Use 2 to 5 named tracks such as $drums:, $bass:, $chords:, $lead:, $pad:.
- Do not hide multiple voices inside one track with stack(...).
- Do not use semicolons if they are unnecessary, and do not wrap the whole program in markdown fences.
- Keep the result immediately listenable as a looping sketch.
- Favor dependable, common Strudel constructs and stable sample/synth choices.
- Keep harmony and bass coherent.
- If broad style defaults conflict with an explicit music-gene instruction, follow the explicit gene instruction.
- Blend conflicts creatively instead of refusing the combination.
- Avoid unsupported or exotic functions unless they are clearly safe.

Style tags:
${styleSection}

Fine-grained music genes:
${geneSection}

Custom user instructions:
${customSection}

Extra local context file:
${contextFileSection}

Reference sketches:
${referenceSection}

Composition guidance:
- The result should feel intentional within the first few seconds.
- Use clear groove definition unless the tags strongly imply ambient or drone-first behavior.
- Use arrangement restraint: short loops, strong identity, no long-form song structure.
- If there are no style tags, infer a neutral style from the genes.
- If there are no genes, produce a concise canonical sketch for the chosen style tags.

Valid output shape example:
setCpm(124/4)

$drums: s("bd ~ bd ~, ~ hh ~ hh, ~ sd ~ ~, ~ ~ cp ~").bank("RolandTR909")
$bass: note("c2 ~ g1 ~ a1 ~ g1 ~").s("sawtooth").lpf(520)
$chords: note("<[c4,e4,g4,b4] [a3,c4,e4,g4]>").s("gm_epiano1").gain(0.3).room(0.2)
`;
}
