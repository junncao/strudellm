import { createTagGameContextFile } from "@/app/taggame/_lib/taggame-context-file";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  path?: string;
};

function isPathModeEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  if (!isPathModeEnabled()) {
    return NextResponse.json({ error: "Local path mode is disabled." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as RequestBody | null;
  const filePath = body?.path?.trim();

  if (!filePath) {
    return NextResponse.json({ error: "Missing local file path." }, { status: 400 });
  }

  if (!path.isAbsolute(filePath)) {
    return NextResponse.json({ error: "Enter an absolute local file path." }, { status: 400 });
  }

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "That path does not point to a file." }, { status: 400 });
    }

    const text = await fs.readFile(filePath, "utf8");
    const contextFile = createTagGameContextFile(path.basename(filePath), text);

    return NextResponse.json({ contextFile });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to read local debug file." }, { status: 500 });
  }
}
