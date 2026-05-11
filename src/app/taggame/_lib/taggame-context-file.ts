export type TagGameContextFile = {
  fileName: string;
  content: string;
  truncated: boolean;
  originalLength: number;
  loadedAt: number;
};

export type TagGameContextSource =
  | { kind: "upload"; file: TagGameContextFile }
  | { kind: "path"; path: string };

const STORAGE_KEY = "taggame-debug-context-source";
const MAX_CONTEXT_FILE_CHARS = 12000;

function safeLocalStorageGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeLocalStorageRemoveItem(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {}
}

function isTagGameContextFile(value: unknown): value is TagGameContextFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const parsed = value as Partial<TagGameContextFile>;
  return typeof parsed.fileName === "string"
    && typeof parsed.content === "string"
    && typeof parsed.truncated === "boolean"
    && typeof parsed.originalLength === "number"
    && typeof parsed.loadedAt === "number";
}

function isTagGameContextSource(value: unknown): value is TagGameContextSource {
  if (!value || typeof value !== "object") {
    return false;
  }

  const parsed = value as Partial<TagGameContextSource>;
  if (parsed.kind === "path") {
    return typeof parsed.path === "string";
  }

  if (parsed.kind === "upload") {
    return isTagGameContextFile(parsed.file);
  }

  return false;
}

export function createTagGameContextFile(fileName: string, text: string): TagGameContextFile {
  const normalized = text.replace(/\r\n/g, "\n");

  return {
    fileName,
    content: normalized.slice(0, MAX_CONTEXT_FILE_CHARS),
    truncated: normalized.length > MAX_CONTEXT_FILE_CHARS,
    originalLength: normalized.length,
    loadedAt: Date.now(),
  };
}

export function loadStoredTagGameContextSource(): TagGameContextSource | null {
  const raw = safeLocalStorageGetItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (isTagGameContextSource(parsed)) {
      return parsed;
    }

    if (isTagGameContextFile(parsed)) {
      return { kind: "upload", file: parsed };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveStoredTagGameContextSource(contextSource: TagGameContextSource): void {
  safeLocalStorageSetItem(STORAGE_KEY, JSON.stringify(contextSource));
}

export function clearStoredTagGameContextSource(): void {
  safeLocalStorageRemoveItem(STORAGE_KEY);
}

export async function readTagGameContextFile(file: File): Promise<TagGameContextFile> {
  const text = await file.text();
  return createTagGameContextFile(file.name, text);
}
