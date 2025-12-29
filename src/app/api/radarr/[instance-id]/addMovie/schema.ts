import { z } from 'zod';

export const requestBodySchema = z.object({
  query: z.string(),
  year: z
    .string()
    .or(z.number())
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10))),
  tmdbId: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => (val ? String(val).trim() : undefined)),
  release: z
    .object({
      title: z.string(),
      infoUrl: z.string().optional(),
      downloadUrl: z.string().optional(),
      magnetUrl: z.string().optional(),
      size: z
        .string()
        .or(z.number())
        .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10) || 0)),
      indexer: z.string(),
      downloadProtocol: z.string(),
      protocol: z.string(),
    })
    .optional(),
});
