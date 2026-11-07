import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as collectionRepo from '../repositories/collectionRepo';
import * as itemRepo from '../repositories/itemRepo';
import { DbCollection, DbCollectionItem } from '../repositories/collectionRepo';
import { notFound, makeError } from '../utils/errors';

export type { AppError } from '../utils/errors';

export interface ApiCollection {
  id: string;
  name: string;
}

export interface ApiCollectionDetail extends ApiCollection {
  items: ApiCollectionItem[];
}

export interface ApiCollectionItem {
  id: string;
  title: string;
  type: 'book' | 'series' | 'film';
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  rating: number | null;
  createdAt: string;
}


function assertOwner(col: DbCollection | undefined, userId: string): DbCollection {
  if (!col || col.user_id !== userId) throw notFound();
  return col;
}

function toApiCollection(col: DbCollection): ApiCollection {
  return { id: col.id, name: col.name };
}

function toApiItem(item: DbCollectionItem): ApiCollectionItem {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    rating: item.rating,
    createdAt: item.created_at,
  };
}

export function listCollections(db: Database.Database, userId: string): ApiCollection[] {
  return collectionRepo.getUserCollections(db, userId).map(toApiCollection);
}

export function getCollection(
  db: Database.Database,
  id: string,
  userId: string,
): ApiCollectionDetail {
  const col = assertOwner(collectionRepo.getCollectionById(db, id), userId);
  const items = collectionRepo.getCollectionItems(db, id).map(toApiItem);
  return { ...toApiCollection(col), items };
}

export function createCollection(
  db: Database.Database,
  userId: string,
  name: string,
): ApiCollection {
  const id = uuidv4();
  return toApiCollection(collectionRepo.createCollection(db, id, userId, name));
}

export function updateCollection(
  db: Database.Database,
  id: string,
  userId: string,
  name: string,
): ApiCollection {
  assertOwner(collectionRepo.getCollectionById(db, id), userId);
  return toApiCollection(collectionRepo.updateCollection(db, id, name));
}

export function deleteCollection(db: Database.Database, id: string, userId: string): void {
  assertOwner(collectionRepo.getCollectionById(db, id), userId);
  collectionRepo.deleteCollection(db, id);
}

export function addItemToCollection(
  db: Database.Database,
  collectionId: string,
  itemId: string,
  userId: string,
): { itemId: string; collectionId: string } {
  const addTx = db.transaction(() => {
    assertOwner(collectionRepo.getCollectionById(db, collectionId), userId);

    const item = itemRepo.getItemById(db, itemId);
    if (!item || item.user_id !== userId) throw notFound();

    if (collectionRepo.collectionHasItem(db, collectionId, itemId)) {
      throw makeError('ITEM_ALREADY_IN_COLLECTION', 'Елемент вже є в цій добірці', 409);
    }

    collectionRepo.addItemToCollection(db, collectionId, itemId);
  });

  addTx();
  return { itemId, collectionId };
}

export function removeItemFromCollection(
  db: Database.Database,
  collectionId: string,
  itemId: string,
  userId: string,
): void {
  assertOwner(collectionRepo.getCollectionById(db, collectionId), userId);
  collectionRepo.removeItemFromCollection(db, collectionId, itemId);
}
