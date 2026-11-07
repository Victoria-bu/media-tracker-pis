import Database from 'better-sqlite3';

export interface StatsRow {
  type: string;
  cnt: number;
}

export function getStatsByPeriod(
  _db: Database.Database,
  _userId: string,
  _period: 'month' | 'year' | 'all',
): StatsRow[] {
  throw new Error('Not implemented');
}
