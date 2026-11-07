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

export function getSessionStatsByPeriod(
  db: Database.Database,
  userId: string,
  period: 'month' | 'year' | 'all',
): StatsRow[] {
  const refDate = getClock()().toISOString();

  let dateFilter = '';
  const params: string[] = [userId];

  if (period === 'month') {
    dateFilter = "AND strftime('%Y-%m', s.date) = strftime('%Y-%m', ?)";
    params.push(refDate);
  } else if (period === 'year') {
    dateFilter = "AND strftime('%Y', s.date) = strftime('%Y', ?)";
    params.push(refDate);
  }

  return db.prepare(`
    SELECT i.type, COUNT(*) as cnt
    FROM sessions s
    JOIN items i ON i.id = s.item_id
    WHERE i.user_id = ?
      ${dateFilter}
    GROUP BY i.type
  `).all(...params) as StatsRow[];
}
