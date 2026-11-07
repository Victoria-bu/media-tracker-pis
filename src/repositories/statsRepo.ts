import Database from 'better-sqlite3';
import { getClock } from '../utils/clock';

export interface StatsRow {
  type: string;
  cnt: number;
}

export function getStatsByPeriod(
  db: Database.Database,
  userId: string,
  period: 'month' | 'year' | 'all',
): StatsRow[] {
  const refDate = getClock()().toISOString();

  let dateFilter = '';
  const params: string[] = [userId];

  if (period === 'month') {
    dateFilter = "AND completed_at IS NOT NULL AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', ?)";
    params.push(refDate);
  } else if (period === 'year') {
    dateFilter = "AND completed_at IS NOT NULL AND strftime('%Y', completed_at) = strftime('%Y', ?)";
    params.push(refDate);
  }

  return db.prepare(`
    SELECT type, COUNT(*) as cnt
    FROM items
    WHERE user_id = ?
      AND status = 'completed'
      ${dateFilter}
    GROUP BY type
  `).all(...params) as StatsRow[];
}
