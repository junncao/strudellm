export type TagGameContextFile = {
  fileName: string;
  content: string;
  truncated: boolean;
  originalLength: number;
  loadedAt: number;
};

const STORAGE_KEY = "taggame-debug-context-file";
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

export function loadStoredTagGameContextFile(): TagGameContextFile | null {
  const raw = safeLocalStorageGetItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<TagGameContextFile>;
    if (
      typeof parsed.fileName !== "string"
      || typeof parsed.content !== "string"
      || typeof parsed.truncated !== "boolean"
      || typeof parsed.originalLength !== "number"
      || typeof parsed.loadedAt !== "number"
    ) {
      return null;
    }

    return parsed as TagGameContextFile;
  } catch {
    return null;
  }
}

export function saveStoredTagGameContextFile(contextFile: TagGameContextFile): void {
  safeLocalStorageSetItem(STORAGE_KEY, JSON.stringify(contextFile));
}

export function clearStoredTagGameContextFile(): void {
  safeLocalStorageRemoveItem(STORAGE_KEY);
}

export async function readTagGameContextFile(file: File): Promise<TagGameContextFile> {
  const text = await file.text();
  const normalized = text.replace(/\r\n/g, "\n");

  return {
    fileName: file.name,
    content: normalized.slice(0, MAX_CONTEXT_FILE_CHARS),
    truncated: normalized.length > MAX_CONTEXT_FILE_CHARS,
    originalLength: normalized.length,
    loadedAt: Date.now(),
  };
}
