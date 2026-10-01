import { z } from 'zod';

export const getEventsQuerySchema = z.object({
  q: z.string().optional(),
  keyword: z.string().optional(),
  city: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20)
});

export const getCalendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
  city: z.string().optional()
});
