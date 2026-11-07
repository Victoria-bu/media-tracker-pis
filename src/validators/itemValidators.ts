import { z } from 'zod';

const itemTypeEnum = z.enum(['book', 'series', 'film']);
const itemStatusEnum = z.enum(['planned', 'in_progress', 'completed', 'on_hold']);

const typeSpecificFields = {
  author: z.string().nullable().optional(),
  pages: z.number().int().positive().nullable().optional(),
  seasons: z.number().int().positive().nullable().optional(),
  director: z.string().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
};

export const createItemSchema = z.object({
  title: z.string().min(1),
  type: itemTypeEnum,
  status: itemStatusEnum.optional(),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  completedAt: z.string().nullable().optional(),
  ...typeSpecificFields,
});

export const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  type: itemTypeEnum.optional(),
  status: itemStatusEnum.optional(),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  completedAt: z.string().nullable().optional(),
  ...typeSpecificFields,
});

export type CreateItemData = z.infer<typeof createItemSchema>;
export type UpdateItemData = z.infer<typeof updateItemSchema>;
