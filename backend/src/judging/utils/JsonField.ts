// Tiny helper to serialize/deserialize JSON fields stored as strings in SQLite
export const JsonField = {
  serialize: (value: unknown): string => JSON.stringify(value),
  deserialize: <T = unknown>(value: string | null | undefined): T | null => {
    if (!value) return null;
    try { return JSON.parse(value) as T; } catch { return null; }
  }
};
