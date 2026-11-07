import { z } from 'zod';

export const updateNicknameSchema = z.object({
  nickname: z.string().min(2).max(50),
});
