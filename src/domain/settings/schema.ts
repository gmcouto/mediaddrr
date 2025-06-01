import { z } from 'zod';

const defaultTmdbConfig = {
  token: '',
};
const defaultRadarrConfig = {
  baseUrl: '',
  apiKey: '',
  qualityProfileId: 0,
  tagId0: 0,
  rootFolderPath: '',
};
const defaultSettings = {
  tmdbConfig: defaultTmdbConfig,
  radarrInstances: {
    example: defaultRadarrConfig,
  },
};

export const TmdbConfigSchema = z
  .object({
    token: z.string().catch('').default(''),
  })
  .catch(defaultTmdbConfig);
export type TmdbConfig = z.infer<typeof TmdbConfigSchema>;

export const RadarrConfigSchema = z
  .object({
    baseUrl: z.string().catch('').default(''),
    apiKey: z.string().catch('').default(''),
    qualityProfileId: z
      .preprocess((val) => Number(val), z.number())
      .catch(0)
      .default(0),
    tagId0: z
      .preprocess((val) => Number(val), z.number())
      .catch(0)
      .default(0),
    rootFolderPath: z.string().catch('').default(''),
  })
  .catch(defaultRadarrConfig);
export type RadarrConfig = z.infer<typeof RadarrConfigSchema>;

export const SettingsSchema = z
  .object({
    tmdbConfig: TmdbConfigSchema,
    radarrInstances: z.record(RadarrConfigSchema).catch({}).default({}),
  })
  .catch(defaultSettings);
export type Settings = z.infer<typeof SettingsSchema>;
