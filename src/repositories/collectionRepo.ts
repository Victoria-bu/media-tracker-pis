import Database from 'better-sqlite3';

export interface DbCollection {
  id: string;
  user_id: string;
  name: string;
}

export interface DbCollectionItem {
  collection_id: string;
  item_id: string;
}

export function getCollectionById(_db: Database.Database, _id: string): DbCollection | undefined {
  throw new Error('Not implemented');
}

export function getUserCollections(_db: Database.Database, _userId: string): DbCollection[] {
  throw new Error('Not implemented');
}

export function createCollection(
  _db: Database.Database,
  _id: string,
  _userId: string,
  _name: string,
): DbCollection {
  throw new Error('Not implemented');
}

export function updateCollection(
  _db: Database.Database,
  _id: string,
  _name: string,
): DbCollection {
  throw new Error('Not implemented');
}

export function deleteCollection(_db: Database.Database, _id: string): void {
  throw new Error('Not implemented');
}

export function collectionHasItem(
  _db: Database.Database,
  _collectionId: string,
  _itemId: string,
): boolean {
  throw new Error('Not implemented');
}

export function addItemToCollection(
  _db: Database.Database,
  _collectionId: string,
  _itemId: string,
): void {
  throw new Error('Not implemented');
}

export function removeItemFromCollection(
  _db: Database.Database,
  _collectionId: string,
  _itemId: string,
): void {
  throw new Error('Not implemented');
}

export function getCollectionItems(_db: Database.Database, _collectionId: string): any[] {
  throw new Error('Not implemented');
}
