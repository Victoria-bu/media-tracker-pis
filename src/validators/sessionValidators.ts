import { z } from 'zod';

export const createSessionSchema = z.object({
  date: z.string().min(1),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  note: z.string().nullable().optional(),
});

export const updateSessionSchema = z.object({
  date: z.string().min(1).optional(),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  note: z.string().nullable().optional(),
});

export type CreateSessionData = z.infer<typeof createSessionSchema>;
export type UpdateSessionData = z.infer<typeof updateSessionSchema>;
