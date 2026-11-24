import type Database from 'better-sqlite3';

/**
 * Returns a sorted, deduplicated list of all tags used across the user's catalog items.
 * @param db  Active SQLite connection.
 * @param userId  ID of the authenticated user.
 */
export function getUserTags(db: Database.Database, userId: string): string[] {
  const rows = db
    .prepare('SELECT tags FROM items WHERE user_id = ?')
    .all(userId) as { tags: string }[];
  const tagSet = new Set<string>();
  for (const row of rows) {
    (JSON.parse(row.tags) as string[]).forEach((t) => tagSet.add(t));
  }
  return Array.from(tagSet).sort();
}
