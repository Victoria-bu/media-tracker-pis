import Database from 'better-sqlite3';
import { CreateItemData, UpdateItemData } from '../validators/itemValidators';

export interface DbItem {
  id: string;
  user_id: string;
  title: string;
  type: 'book' | 'series' | 'film';
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  rating: number | null;
  notes: string | null;
  tags: string;
  cover_url: string | null;
  completed_at: string | null;
  created_at: string;
  author: string | null;
  pages: number | null;
  seasons: number | null;
  director: string | null;
  duration: number | null;
}

export function getItemById(db: Database.Database, id: string): DbItem | undefined {
  throw new Error('Not implemented');
}

export function getUserItems(db: Database.Database, userId: string): DbItem[] {
  throw new Error('Not implemented');
}

export function createItem(
  db: Database.Database,
  id: string,
  userId: string,
  data: CreateItemData,
): DbItem {
  throw new Error('Not implemented');
}

export function updateItem(
  db: Database.Database,
  id: string,
  data: UpdateItemData,
): DbItem {
  throw new Error('Not implemented');
}

export function deleteItem(db: Database.Database, id: string): void {
  throw new Error('Not implemented');
}

export function setCoverUrl(db: Database.Database, id: string, coverUrl: string): void {
  throw new Error('Not implemented');
}

export function clearCoverUrl(db: Database.Database, id: string): void {
  throw new Error('Not implemented');
}
