export interface ApiUser {
  id: string;
  email: string;
  nickname: string;
}

export interface ApiItem {
  id: string;
  title: string;
  type: "book" | "series" | "film";
  status: "planned" | "in_progress" | "completed" | "on_hold";
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

export interface ApiSession {
  id: string;
  itemId: string;
  date: string;
  rating: number | null;
  note: string | null;
}

export interface ApiCollection {
  id: string;
  name: string;
}

export interface ApiCollectionItem {
  id: string;
  title: string;
  type: "book" | "series" | "film";
  status: "planned" | "in_progress" | "completed" | "on_hold";
  rating: number | null;
  createdAt: string;
}

export interface ApiCollectionDetail {
  id: string;
  name: string;
  items: ApiCollectionItem[];
}

export interface ApiStats {
  period: "month" | "year" | "all";
  basis: string;
  books: number;
  series: number;
  films: number;
  total: number;
}
