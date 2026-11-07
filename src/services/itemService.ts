import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as itemRepo from '../repositories/itemRepo';
import { DbItem } from '../repositories/itemRepo';
import { CreateItemData, UpdateItemData } from '../validators/itemValidators';
import { notFound } from '../utils/errors';

export type { AppError } from '../utils/errors';

export interface ApiItem {
  id: string;
  title: string;
  type: 'book' | 'series' | 'film';
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  rating: number | null;
  notes: string | null;
  tags: string[];
  coverUrl: string | null;
  completedAt: string | null;
  createdAt: string;
  author: string | null;
  pages: number | null;
  seasons: number | null;
  director: string | null;
  duration: number | null;
}

function toApi(item: DbItem): ApiItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    rating: item.rating,
    notes: item.notes,
    tags: JSON.parse(item.tags) as string[],
    coverUrl: item.cover_url,
    completedAt: item.completed_at,
    createdAt: item.created_at,
    author: item.author,
    pages: item.pages,
    seasons: item.seasons,
    director: item.director,
    duration: item.duration,
  };
}

function assertOwner(item: DbItem | undefined, userId: string): DbItem {
  if (!item || item.user_id !== userId) throw notFound();
  return item;
}

export function listItems(db: Database.Database, userId: string): ApiItem[] {
  return itemRepo.getUserItems(db, userId).map(toApi);
}

export function getItem(db: Database.Database, id: string, userId: string): ApiItem {
  return toApi(assertOwner(itemRepo.getItemById(db, id), userId));
}

export function createItem(
  db: Database.Database,
  userId: string,
  data: CreateItemData,
): ApiItem {
  const id = uuidv4();
  return toApi(itemRepo.createItem(db, id, userId, data));
}

export function updateItem(
  db: Database.Database,
  id: string,
  userId: string,
  data: UpdateItemData,
): ApiItem {
  assertOwner(itemRepo.getItemById(db, id), userId);
  return toApi(itemRepo.updateItem(db, id, data));
}

export function deleteItem(db: Database.Database, id: string, userId: string): void {
  assertOwner(itemRepo.getItemById(db, id), userId);
  itemRepo.deleteItem(db, id);
}

export function setCoverUrl(
  db: Database.Database,
  id: string,
  userId: string,
  coverUrl: string,
): ApiItem {
  assertOwner(itemRepo.getItemById(db, id), userId);
  itemRepo.setCoverUrl(db, id, coverUrl);
  return toApi(itemRepo.getItemById(db, id)!);
}

export function clearCoverUrl(db: Database.Database, id: string, userId: string): void {
  assertOwner(itemRepo.getItemById(db, id), userId);
  itemRepo.clearCoverUrl(db, id);
}
