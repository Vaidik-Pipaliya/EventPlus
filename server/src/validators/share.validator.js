import { z } from 'zod';

export const shareEventParamSchema = z.object({
  eventId: z.string().min(1, 'eventId is required')
});

export const shareTokenParamSchema = z.object({
  token: z.string().min(1, 'token is required')
});
