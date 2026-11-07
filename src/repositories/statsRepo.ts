import Database from 'better-sqlite3';

export interface StatsRow {
  type: string;
  cnt: number;
}

export function getStatsByPeriod(
  db: Database.Database,
  userId: string,
  period: 'month' | 'year' | 'all',
): StatsRow[] {
  let dateFilter = '';
  if (period === 'month') {
    dateFilter = "AND completed_at IS NOT NULL AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now')";
  } else if (period === 'year') {
    dateFilter = "AND completed_at IS NOT NULL AND strftime('%Y', completed_at) = strftime('%Y', 'now')";
  }

  return db.prepare(`
    SELECT type, COUNT(*) as cnt
    FROM items
    WHERE user_id = ?
      AND status = 'completed'
      ${dateFilter}
    GROUP BY type
  `).all(userId) as StatsRow[];
}
