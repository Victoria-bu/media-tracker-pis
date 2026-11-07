import Database from 'better-sqlite3';

export interface DbCollection {
  id: string;
  user_id: string;
  name: string;
}

export interface DbCollectionItem {
  id: string;
  user_id: string;
  title: string;
  type: 'book' | 'series' | 'film';
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  rating: number | null;
  created_at: string;
}

export function getCollectionById(db: Database.Database, id: string): DbCollection | undefined {
  return db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as DbCollection | undefined;
}

export function getUserCollections(db: Database.Database, userId: string): DbCollection[] {
  return db
    .prepare('SELECT * FROM collections WHERE user_id = ? ORDER BY rowid ASC')
    .all(userId) as DbCollection[];
}

export function createCollection(
  db: Database.Database,
  id: string,
  userId: string,
  name: string,
): DbCollection {
  db.prepare('INSERT INTO collections (id, user_id, name) VALUES (?, ?, ?)').run(id, userId, name);
  return getCollectionById(db, id)!;
}

export function updateCollection(db: Database.Database, id: string, name: string): DbCollection {
  db.prepare('UPDATE collections SET name = ? WHERE id = ?').run(name, id);
  return getCollectionById(db, id)!;
}

export function deleteCollection(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM collections WHERE id = ?').run(id);
}

export function collectionHasItem(
  db: Database.Database,
  collectionId: string,
  itemId: string,
): boolean {
  const row = db
    .prepare('SELECT 1 FROM collection_items WHERE collection_id = ? AND item_id = ?')
    .get(collectionId, itemId);
  return row !== undefined;
}

export function addItemToCollection(
  db: Database.Database,
  collectionId: string,
  itemId: string,
): void {
  db.prepare('INSERT INTO collection_items (collection_id, item_id) VALUES (?, ?)').run(
    collectionId,
    itemId,
  );
}

export function removeItemFromCollection(
  db: Database.Database,
  collectionId: string,
  itemId: string,
): void {
  const result = db
    .prepare('DELETE FROM collection_items WHERE collection_id = ? AND item_id = ?')
    .run(collectionId, itemId);
  if (result.changes === 0) {
    const err = new Error('Resource not found') as any;
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
}

export function getCollectionItems(db: Database.Database, collectionId: string): DbCollectionItem[] {
  return db.prepare(`
    SELECT i.id, i.title, i.type, i.status, i.rating, i.created_at
    FROM items i
    JOIN collection_items ci ON ci.item_id = i.id
    WHERE ci.collection_id = ?
    ORDER BY i.created_at ASC
  `).all(collectionId) as DbCollectionItem[];
}
