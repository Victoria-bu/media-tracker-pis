import { z } from 'zod';

export const periodSchema = z.enum(['month', 'year', 'all']);
export const basisSchema = z.enum(['completedAt', 'sessions']);

export type Period = z.infer<typeof periodSchema>;
export type Basis = z.infer<typeof basisSchema>;
