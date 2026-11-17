import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as itemRepo from '../repositories/itemRepo';
import type { DbItem } from '../repositories/itemRepo';
import type { CreateItemData, UpdateItemData } from '../validators/itemValidators';
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
    createdAt: new Date(item.created_at.replace(' ', 'T') + 'Z').toISOString(),
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

/**
 * Returns all catalog items owned by the given user, sorted by creation date descending.
 * @param db  Active SQLite connection.
 * @param userId  ID of the authenticated user.
 */
export function listItems(db: Database.Database, userId: string): ApiItem[] {
  return itemRepo.getUserItems(db, userId).map(toApi);
}

/**
 * Returns a single catalog item by its ID.
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 */
export function getItem(db: Database.Database, id: string, userId: string): ApiItem {
  return toApi(assertOwner(itemRepo.getItemById(db, id), userId));
}

/**
 * Creates a new catalog item and returns it.
 * A UUID is generated internally; the caller supplies only business data.
 * Tags are stored as a JSON array in SQLite and returned as a parsed string[].
 */
export function createItem(
  db: Database.Database,
  userId: string,
  data: CreateItemData,
): ApiItem {
  const id = uuidv4();
  return toApi(itemRepo.createItem(db, id, userId, data));
}

/**
 * Applies a partial update to an existing catalog item.
 * Only fields present in `data` are changed; omitted fields keep their current values.
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 */
export function updateItem(
  db: Database.Database,
  id: string,
  userId: string,
  data: UpdateItemData,
): ApiItem {
  assertOwner(itemRepo.getItemById(db, id), userId);
  return toApi(itemRepo.updateItem(db, id, data));
}

/**
 * Permanently deletes a catalog item and all its associated sessions.
 * Removal from collections is handled by ON DELETE CASCADE in the DB schema.
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 */
export function deleteItem(db: Database.Database, id: string, userId: string): void {
  assertOwner(itemRepo.getItemById(db, id), userId);
  itemRepo.deleteItem(db, id);
}

/**
 * Stores the cover image URL for a catalog item and returns the updated item.
 * The file must already be saved to disk before calling this function.
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 */
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

/**
 * Removes the cover image URL from a catalog item (sets cover_url to NULL).
 * Does not delete the file from disk — that is the caller's responsibility.
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 */
export function clearCoverUrl(db: Database.Database, id: string, userId: string): void {
  assertOwner(itemRepo.getItemById(db, id), userId);
  itemRepo.clearCoverUrl(db, id);
}
