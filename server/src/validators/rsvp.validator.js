import { z } from 'zod';

export const createRsvpSchema = z.object({
  eventId: z.string().min(1, 'eventId is required')
});

export const updateReminderSchema = z.object({
  enabled: z.boolean().default(true),
  remindBefore: z.enum(['1h', '1d', '1w']).default('1d')
});
