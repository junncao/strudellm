import { createTagGameContextFile } from "@/app/taggame/_lib/taggame-context-file";
import { getTagGameGeneDocRefsByIds } from "@/app/taggame/_lib/taggame-gene-docs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  geneIds?: string[];
};

const GENE_DOCS_ROOT = path.resolve(process.cwd(), "src/app/gene");

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const geneIds = Array.isArray(body?.geneIds)
    ? body.geneIds.filter((geneId): geneId is string => typeof geneId === "string")
    : [];

  if (geneIds.length === 0) {
    return NextResponse.json({ geneDocs: [] });
  }

  const docRefs = getTagGameGeneDocRefsByIds(geneIds);
  if (docRefs.length === 0) {
    return NextResponse.json({ geneDocs: [] });
  }

  try {
    const geneDocs = await Promise.all(
      docRefs.map(async (docRef) => {
        const filePath = path.resolve(process.cwd(), docRef.repoRelativePath);
        const relativeToRoot = path.relative(GENE_DOCS_ROOT, filePath);

        if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
          throw new Error(`Gene doc path is outside the allowed directory: ${docRef.repoRelativePath}`);
        }

        const text = await fs.readFile(filePath, "utf8");

        return {
          geneId: docRef.geneId,
          geneName: docRef.geneName,
          contextFile: createTagGameContextFile(docRef.fileName, text),
        };
      }),
    );

    return NextResponse.json({ geneDocs });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "A selected gene handbook file was not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to load selected gene handbook docs." },
      { status: 500 },
    );
  }
}
