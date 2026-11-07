import Database from 'better-sqlite3';
import * as statsRepo from '../repositories/statsRepo';

export interface ApiStats {
  period: 'month' | 'year' | 'all';
  books: number;
  series: number;
  films: number;
  total: number;
}

export function getStats(
  db: Database.Database,
  userId: string,
  period: 'month' | 'year' | 'all',
): ApiStats {
  const rows = statsRepo.getStatsByPeriod(db, userId, period);
  const result: ApiStats = { period, books: 0, series: 0, films: 0, total: 0 };
  for (const row of rows) {
    if (row.type === 'book') result.books = row.cnt;
    else if (row.type === 'series') result.series = row.cnt;
    else if (row.type === 'film') result.films = row.cnt;
  }
  result.total = result.books + result.series + result.films;
  return result;
}
