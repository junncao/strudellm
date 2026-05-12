import { promises as fs } from "node:fs";
import path from "node:path";

const GAME_SOURCE_DIR = path.join(process.cwd(), "src/app/games");

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

export async function listGameHtmlSlugs() {
  const entries = await fs.readdir(GAME_SOURCE_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name.replace(/\.html$/, ""))
    .sort();
}

export async function readGameFile(pathParts: string[]) {
  if (pathParts.length !== 1) {
    return null;
  }

  const [fileName] = pathParts;
  if (!fileName || fileName.includes("/")) {
    return null;
  }

  const extension = path.extname(fileName);
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return null;
  }

  const filePath = path.join(GAME_SOURCE_DIR, fileName);
  const relativePath = path.relative(GAME_SOURCE_DIR, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  try {
    const body = await fs.readFile(filePath);
    return { body, contentType };
  } catch {
    return null;
  }
}
