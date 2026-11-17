import type {
  ApiUser,
  ApiItem,
  ApiSession,
  ApiCollection,
  ApiCollectionDetail,
  ApiStats,
} from "../types/api";

const BASE = "/api/v1";

interface ApiError extends Error {
  status: number;
  code: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers:
      init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json", ...(init.headers as Record<string, string>) }
        : (init?.headers as Record<string, string>),
  });

  if (res.status === 204) return undefined as unknown as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = Object.assign(new Error(body.message ?? "Request failed"), {
      status: res.status,
      code: body.code ?? "UNKNOWN",
    }) as ApiError;
    throw err;
  }

  return body as T;
}

export type { ApiError };

export interface CreateItemBody {
  title: string;
  type: "book" | "series" | "film";
  status?: "planned" | "in_progress" | "completed" | "on_hold";
  rating?: number | null;
  notes?: string | null;
  tags?: string[];
  completedAt?: string | null;
  author?: string | null;
  pages?: number | null;
  seasons?: number | null;
  director?: string | null;
  duration?: number | null;
}

export interface UpdateItemBody {
  title?: string;
  type?: "book" | "series" | "film";
  status?: "planned" | "in_progress" | "completed" | "on_hold";
  rating?: number | null;
  notes?: string | null;
  tags?: string[];
  completedAt?: string | null;
  author?: string | null;
  pages?: number | null;
  seasons?: number | null;
  director?: string | null;
  duration?: number | null;
}

export interface CreateSessionBody {
  date: string;
  rating?: number | null;
  note?: string | null;
}

export interface UpdateSessionBody {
  date?: string;
  rating?: number | null;
  note?: string | null;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; nickname: string }) =>
      request<ApiUser>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<ApiUser>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
  },

  items: {
    list: () => request<ApiItem[]>("/items"),
    create: (body: CreateItemBody) =>
      request<ApiItem>("/items", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request<ApiItem>(`/items/${id}`),
    update: (id: string, body: UpdateItemBody) =>
      request<ApiItem>(`/items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    del: (id: string) => request<void>(`/items/${id}`, { method: "DELETE" }),
    uploadCover: (id: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<{ coverUrl: string }>(`/items/${id}/cover`, { method: "POST", body: form });
    },
    deleteCover: (id: string) => request<void>(`/items/${id}/cover`, { method: "DELETE" }),
  },

  sessions: {
    list: (itemId: string) =>
      request<{ sessions: ApiSession[]; total: number }>(`/items/${itemId}/sessions`),
    create: (itemId: string, body: CreateSessionBody) =>
      request<ApiSession>(`/items/${itemId}/sessions`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (itemId: string, sid: string, body: UpdateSessionBody) =>
      request<ApiSession>(`/items/${itemId}/sessions/${sid}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    del: (itemId: string, sid: string) =>
      request<void>(`/items/${itemId}/sessions/${sid}`, { method: "DELETE" }),
  },

  collections: {
    list: () => request<ApiCollection[]>("/collections"),
    create: (body: { name: string }) =>
      request<ApiCollection>("/collections", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request<ApiCollectionDetail>(`/collections/${id}`),
    update: (id: string, body: { name: string }) =>
      request<ApiCollection>(`/collections/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    del: (id: string) => request<void>(`/collections/${id}`, { method: "DELETE" }),
    addItem: (collectionId: string, body: { itemId: string }) =>
      request<{ itemId: string; collectionId: string }>(`/collections/${collectionId}/items`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    removeItem: (collectionId: string, itemId: string) =>
      request<void>(`/collections/${collectionId}/items/${itemId}`, { method: "DELETE" }),
  },

  stats: {
    get: (period: "month" | "year" | "all") =>
      request<ApiStats>(`/stats?period=${period}`),
  },

  tags: {
    list: () => request<string[]>("/tags"),
  },

  users: {
    updateNickname: (body: { nickname: string }) =>
      request<ApiUser>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  },
};
