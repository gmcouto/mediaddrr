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
const defaultVariable = {
  name: '',
  from: null,
  regex: '',
  replaceWith: '',
};
const defaultProcessor = {
  tag: '',
  variables: [],
  output: '',
};
const defaultRssFeed = {
  url: '',
  processors: [],
};
const defaultSettings = {
  tmdbConfig: defaultTmdbConfig,
  radarrInstances: {
    example: defaultRadarrConfig,
  },
  rssFeeds: {},
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

export const VariableSchema = z
  .object({
    name: z.string().catch('').default(''),
    from: z.union([z.string(), z.null(), z.undefined()]).catch(null).default(null).optional(),
    regex: z.string().catch('').default(''),
    replaceWith: z.string().catch('').default(''),
  })
  .catch(defaultVariable);
export type Variable = z.infer<typeof VariableSchema>;

export const ProcessorSchema = z
  .object({
    tag: z.string().catch('').default(''),
    variables: z.array(VariableSchema).catch([]).default([]),
    output: z.string().catch('').default(''),
  })
  .catch(defaultProcessor);
export type Processor = z.infer<typeof ProcessorSchema>;

export const RssFeedSchema = z
  .object({
    url: z.string().catch('').default(''),
    processors: z.array(ProcessorSchema).catch([]).default([]),
  })
  .catch(defaultRssFeed);
export type RssFeed = z.infer<typeof RssFeedSchema>;

export const SettingsSchema = z
  .object({
    tmdbConfig: TmdbConfigSchema,
    radarrInstances: z
      .record(z.string(), RadarrConfigSchema)
      .catch({} as Record<string, z.infer<typeof RadarrConfigSchema>>)
      .default({}),
    rssFeeds: z
      .record(z.string(), RssFeedSchema)
      .catch({} as Record<string, z.infer<typeof RssFeedSchema>>)
      .default({}),
  })
  .catch(defaultSettings);
export type Settings = z.infer<typeof SettingsSchema>;
