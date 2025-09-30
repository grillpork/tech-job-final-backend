import { z } from 'zod';

export const trendQuerySchema = z.object({
  period: z.enum(['day', 'month', 'year']).default('month'),
});

export const getTrendRequestSchema = z.object({
  query: trendQuerySchema,
});