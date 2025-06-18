import { z } from 'zod';

export const requestBodySchema = z.object({
  query: z.string(),
  year: z.number().transform((val) => (typeof val === 'number' ? val : parseInt(val, 10))),
  tmdbId: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => String(val).trim()),
});
