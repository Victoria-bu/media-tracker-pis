import { z } from 'zod';

/**
 * period: time window for statistics queries.
 * basis:  counting method — `completedAt` (by item completion date) or `sessions` (by session date).
 */
export const periodSchema = z.enum(['month', 'year', 'all']);
export const basisSchema = z.enum(['completedAt', 'sessions']);

export type Period = z.infer<typeof periodSchema>;
export type Basis = z.infer<typeof basisSchema>;
