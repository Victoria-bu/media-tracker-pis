import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().min(1),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1),
});

export const addItemSchema = z.object({
  itemId: z.string().uuid(),
});

export type CreateCollectionData = z.infer<typeof createCollectionSchema>;
