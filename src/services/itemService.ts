import Database from 'better-sqlite3';
import { DbItem } from '../repositories/itemRepo';
import { CreateItemData, UpdateItemData } from '../validators/itemValidators';

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

export interface AppError extends Error {
  code: string;
  status: number;
}

export function listItems(_db: Database.Database, _userId: string): ApiItem[] {
  throw new Error('Not implemented');
}

export function getItem(
  _db: Database.Database,
  _id: string,
  _userId: string,
): ApiItem {
  throw new Error('Not implemented');
}

export function createItem(
  _db: Database.Database,
  _userId: string,
  _data: CreateItemData,
): ApiItem {
  throw new Error('Not implemented');
}

export function updateItem(
  _db: Database.Database,
  _id: string,
  _userId: string,
  _data: UpdateItemData,
): ApiItem {
  throw new Error('Not implemented');
}

export function deleteItem(
  _db: Database.Database,
  _id: string,
  _userId: string,
): void {
  throw new Error('Not implemented');
}

export function setCoverUrl(
  _db: Database.Database,
  _id: string,
  _userId: string,
  _coverUrl: string,
): ApiItem {
  throw new Error('Not implemented');
}

export function clearCoverUrl(
  _db: Database.Database,
  _id: string,
  _userId: string,
): void {
  throw new Error('Not implemented');
}
