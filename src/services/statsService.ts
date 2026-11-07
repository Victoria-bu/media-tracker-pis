import Database from 'better-sqlite3';

export interface ApiStats {
  period: 'month' | 'year' | 'all';
  books: number;
  series: number;
  films: number;
  total: number;
}

export function getStats(
  _db: Database.Database,
  _userId: string,
  _period: 'month' | 'year' | 'all',
): ApiStats {
  throw new Error('Not implemented');
}
