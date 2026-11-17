import type Database from 'better-sqlite3';
import * as statsRepo from '../repositories/statsRepo';
import type { StatsRow } from '../repositories/statsRepo';
import type { Period, Basis } from '../validators/statsValidators';

export interface ApiStats {
  period: Period;
  basis: Basis;
  books: number;
  series: number;
  films: number;
  total: number;
}

function aggregateRows(rows: StatsRow[], period: Period, basis: Basis): ApiStats {
  const result: ApiStats = { period, basis, books: 0, series: 0, films: 0, total: 0 };
  for (const row of rows) {
    if (row.type === 'book') result.books = row.cnt;
    else if (row.type === 'series') result.series = row.cnt;
    else if (row.type === 'film') result.films = row.cnt;
  }
  result.total = result.books + result.series + result.films;
  return result;
}

/**
 * Returns item-count statistics for a user, broken down by content type.
 * @param period  Time window: `month` (current calendar month), `year` (current year), `all`.
 * @param basis   Counting method:
 *   - `completedAt` — counts items with `status = completed` and a matching `completed_at` date.
 *   - `sessions` — counts distinct sessions regardless of item status.
 */
export function getStats(
  db: Database.Database,
  userId: string,
  period: Period,
  basis: Basis = 'completedAt',
): ApiStats {
  const rows =
    basis === 'sessions'
      ? statsRepo.getSessionStatsByPeriod(db, userId, period)
      : statsRepo.getStatsByPeriod(db, userId, period);

  return aggregateRows(rows, period, basis);
}
