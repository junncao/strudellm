import type { TagGameContextFile } from "./taggame-context-file";
import type { TagGameGeneTag } from "./taggame-tags";

export type TagGameGeneDocRef = {
  geneId: string;
  geneName: string;
  fileName: string;
  repoRelativePath: string;
};

export type TagGameGeneDoc = {
  geneId: string;
  geneName: string;
  contextFile: TagGameContextFile;
};

const tagGameGeneDocRefs: TagGameGeneDocRef[] = [
  {
    geneId: "four-on-floor-kick",
    geneName: "4-4 kick",
    fileName: "4-4 kick.md",
    repoRelativePath: "src/app/gene/rhythm/4-4 kick.md",
  },
  {
    geneId: "four-on-floor-snare",
    geneName: "4-4 snare",
    fileName: "4-4 snare.md",
    repoRelativePath: "src/app/gene/rhythm/4-4 snare.md",
  },
  {
    geneId: "sparse-kick",
    geneName: "sparse kick",
    fileName: "sparse kick.md",
    repoRelativePath: "src/app/gene/rhythm/sparse kick.md",
  },
  {
    geneId: "snare-on-2-and-4",
    geneName: "snare on 2 and 4",
    fileName: "snare on 2 and 4.md",
    repoRelativePath: "src/app/gene/rhythm/snare on 2 and 4.md",
  },
  {
    geneId: "half-time-snare",
    geneName: "half-time snare",
    fileName: "half-time snare.md",
    repoRelativePath: "src/app/gene/rhythm/half-time snare.md",
  },
  {
    geneId: "eighth-hihat",
    geneName: "8th hihat",
    fileName: "8th hihat.md",
    repoRelativePath: "src/app/gene/rhythm/8th hihat.md",
  },
  {
    geneId: "sixteenth-hihat",
    geneName: "16th hihat",
    fileName: "16th hihat.md",
    repoRelativePath: "src/app/gene/rhythm/16th hihat.md",
  },
  {
    geneId: "clap-on-2-and-4",
    geneName: "clap on 2 and 4",
    fileName: "clap on 2 and 4.md",
    repoRelativePath: "src/app/gene/rhythm/clap on 2 and 4.md",
  },
  {
    geneId: "ghost-snare",
    geneName: "ghost snare",
    fileName: "ghost snares.md",
    repoRelativePath: "src/app/gene/rhythm/ghost snares.md",
  },
  {
    geneId: "offbeat-open-hat",
    geneName: "offbeat open hat",
    fileName: "offbeat open hat.md",
    repoRelativePath: "src/app/gene/rhythm/offbeat open hat.md",
  },
  {
    geneId: "triplet-pulse",
    geneName: "triplet pulse",
    fileName: "triplet pulse.md",
    repoRelativePath: "src/app/gene/rhythm/triplet pulse.md",
  },
];

const geneDocRefById = new Map(tagGameGeneDocRefs.map((ref) => [ref.geneId, ref]));

export function getTagGameGeneDocRefsByIds(geneIds: string[]): TagGameGeneDocRef[] {
  const seen = new Set<string>();

  return geneIds.flatMap((geneId) => {
    if (seen.has(geneId)) {
      return [];
    }

    seen.add(geneId);
    const ref = geneDocRefById.get(geneId);
    return ref ? [ref] : [];
  });
}

export function getTagGameGeneDocRefs(genes: TagGameGeneTag[]): TagGameGeneDocRef[] {
  return getTagGameGeneDocRefsByIds(genes.map((gene) => gene.id));
}

export async function resolveTagGameGeneDocs(
  genes: TagGameGeneTag[],
): Promise<TagGameGeneDoc[]> {
  const refs = getTagGameGeneDocRefs(genes);
  if (refs.length === 0) {
    return [];
  }

  const response = await fetch("/api/taggame/gene-context", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geneIds: refs.map((ref) => ref.geneId) }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; geneDocs?: TagGameGeneDoc[] }
    | null;

  if (!response.ok || !payload?.geneDocs) {
    throw new Error(payload?.error || "Failed to load gene handbook context.");
  }

  return payload.geneDocs;
}
