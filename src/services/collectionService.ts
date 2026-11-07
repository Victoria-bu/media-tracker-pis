import Database from 'better-sqlite3';

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

export interface AppError extends Error {
  code: string;
  status: number;
}

export function listCollections(_db: Database.Database, _userId: string): ApiCollection[] {
  throw new Error('Not implemented');
}

export function getCollection(
  _db: Database.Database,
  _id: string,
  _userId: string,
): ApiCollectionDetail {
  throw new Error('Not implemented');
}

export function createCollection(
  _db: Database.Database,
  _userId: string,
  _name: string,
): ApiCollection {
  throw new Error('Not implemented');
}

export function updateCollection(
  _db: Database.Database,
  _id: string,
  _userId: string,
  _name: string,
): ApiCollection {
  throw new Error('Not implemented');
}

export function deleteCollection(
  _db: Database.Database,
  _id: string,
  _userId: string,
): void {
  throw new Error('Not implemented');
}

export function addItemToCollection(
  _db: Database.Database,
  _collectionId: string,
  _itemId: string,
  _userId: string,
): { itemId: string; collectionId: string } {
  throw new Error('Not implemented');
}

export function removeItemFromCollection(
  _db: Database.Database,
  _collectionId: string,
  _itemId: string,
  _userId: string,
): void {
  throw new Error('Not implemented');
}
