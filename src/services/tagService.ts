import Database from 'better-sqlite3';

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
