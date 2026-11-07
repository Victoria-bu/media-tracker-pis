import Database from 'better-sqlite3';
import { getClock } from '../utils/clock';
import { Period } from '../validators/statsValidators';

export interface StatsRow {
  type: string;
  cnt: number;
}

type PeriodFilter = { filter: string; params: string[] };

function buildDateFilter(
  period: Period,
  refDate: string,
  column: string,
  requireNotNull: boolean,
): PeriodFilter {
  if (period === 'all') return { filter: '', params: [] };

  const nullGuard = requireNotNull ? `AND ${column} IS NOT NULL ` : '';

  if (period === 'month') {
    return {
      filter: `${nullGuard}AND strftime('%Y-%m', ${column}) = strftime('%Y-%m', ?)`,
      params: [refDate],
    };
  }
  return {
    filter: `${nullGuard}AND strftime('%Y', ${column}) = strftime('%Y', ?)`,
    params: [refDate],
  };
}

export function getStatsByPeriod(
  db: Database.Database,
  userId: string,
  period: Period,
): StatsRow[] {
  const refDate = getClock()().toISOString();
  const { filter, params } = buildDateFilter(period, refDate, 'completed_at', true);

  return db.prepare(`
    SELECT type, COUNT(*) as cnt
    FROM items
    WHERE user_id = ?
      AND status = 'completed'
      ${filter}
    GROUP BY type
  `).all(userId, ...params) as StatsRow[];
}

export function getSessionStatsByPeriod(
  db: Database.Database,
  userId: string,
  period: Period,
): StatsRow[] {
  const refDate = getClock()().toISOString();
  const { filter, params } = buildDateFilter(period, refDate, 's.date', false);

  return db.prepare(`
    SELECT i.type, COUNT(*) as cnt
    FROM sessions s
    JOIN items i ON i.id = s.item_id
    WHERE i.user_id = ?
      ${filter}
    GROUP BY i.type
  `).all(userId, ...params) as StatsRow[];
}
