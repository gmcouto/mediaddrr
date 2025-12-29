import z from 'zod';
import type { RadarrQualityProfileResponse } from '~/domain/radarr/getQualityProfiles';
import { type Settings } from '~/domain/settings/schema';
import type { RadarrTagResponse } from '~/domain/radarr/getTags';
import type { RadarrRootFolderResponse } from '~/domain/radarr/getRootFolders';

export const TmdbConfigFormSchema = z.object({
  token: z.string().trim().nonempty('Token is required'),
  minimumVoteAverage: z
    .union([
      z
        .string()
        .refine((val) => val === '' || !isNaN(Number(val)), {
          message: 'Must be a valid number',
        })
        .refine((val) => {
          if (val === '') return true;
          const num = Number(val);
          if (isNaN(num)) return true; // Already handled by previous refine
          const decimalPlaces = (val.split('.')[1] || '').length;
          return decimalPlaces <= 2;
        }, {
          message: 'Must have at most 2 decimal places',
        }),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  minimumVoteCount: z
    .union([
      z.string().refine((val) => val === '' || !isNaN(Number(val)), {
        message: 'Must be a valid number',
      }),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  minimumPopularity: z
    .union([
      z
        .string()
        .refine((val) => val === '' || !isNaN(Number(val)), {
          message: 'Must be a valid number',
        })
        .refine((val) => {
          if (val === '') return true;
          const num = Number(val);
          if (isNaN(num)) return true; // Already handled by previous refine
          const decimalPlaces = (val.split('.')[1] || '').length;
          return decimalPlaces <= 2;
        }, {
          message: 'Must have at most 2 decimal places',
        }),
      z.null(),
      z.undefined(),
    ])
    .optional(),
});
export type TmdbConfig = z.infer<typeof TmdbConfigFormSchema>;

const UUID = () => crypto.randomUUID();
const UNIQUE_ID_TYPE = () => z.optional(z.string().nonempty('Form Unique Key is required').default(UUID).catch(UUID));

export const RadarrConfigFormSchema = z.object({
  key: UNIQUE_ID_TYPE(),
  id: z.string().trim().nonempty('An identifier for the instance is required'),
  baseUrl: z.string().trim().nonempty('Base URL is required'),
  apiKey: z.string().trim().nonempty('Api key is required'),
  qualityProfileId: z
    .string()
    .trim()
    .nonempty('Quality profile is required')
    .refine((val) => !isNaN(Number(val)), {
      message: 'Quality profile must be a number',
    }),
  tagId0: z
    .string()
    .trim()
    .nonempty('Tag is required')
    .refine((val) => !isNaN(Number(val)), {
      message: 'Tag ID must be a number',
    }),
  rootFolderPath: z.string().trim().nonempty('Root folder path is required'),
});
export type RadarrConfigForm = z.infer<typeof RadarrConfigFormSchema>;

export const VariableFormSchema = z.object({
  key: UNIQUE_ID_TYPE(),
  name: z.string().trim().nonempty('Variable name is required'),
  from: z.string(),
  regex: z.string().trim().nonempty('Regex pattern is required'),
  replaceWith: z.string().trim(),
});
export type VariableForm = z.infer<typeof VariableFormSchema>;

export const ProcessorFormSchema = z.object({
  key: UNIQUE_ID_TYPE(),
  tag: z.string().trim().nonempty('Tag name is required'),
  variables: z.array(VariableFormSchema),
  output: z.string().trim().nonempty('Output template is required'),
});
export type ProcessorForm = z.infer<typeof ProcessorFormSchema>;

export const PatternFormSchema = z.object({
  key: UNIQUE_ID_TYPE(),
  id: z.string().trim().nonempty('Pattern ID is required'),
  variables: z.array(VariableFormSchema),
  output: z.string().trim().nonempty('Output template is required'),
  aliases: z.string().trim(),
});
export type PatternForm = z.infer<typeof PatternFormSchema>;

export const RssFeedFormSchema = z.object({
  key: UNIQUE_ID_TYPE(),
  id: z.string().trim().nonempty('Feed ID is required'),
  url: z.string().trim().nonempty('URL is required'),
  tags: z.array(
    z.object({
      key: UNIQUE_ID_TYPE(),
      tagName: z.string().trim().nonempty('Tag name is required'),
      patternId: z.string().trim().nonempty('Pattern is required'),
    }),
  ),
});
export type RssFeedForm = z.infer<typeof RssFeedFormSchema>;

export const SettingsFormSchema = z.object({
  tmdbConfig: TmdbConfigFormSchema,
  radarrInstances: z.array(RadarrConfigFormSchema),
  rssFeeds: z.array(RssFeedFormSchema),
  patterns: z.array(PatternFormSchema),
});
export type SettingsForm = z.infer<typeof SettingsFormSchema>;

export function convertToSettings(form: SettingsForm): Settings {
  return {
    tmdbConfig: {
      token: form.tmdbConfig.token,
      minimumVoteAverage:
        form.tmdbConfig.minimumVoteAverage &&
        typeof form.tmdbConfig.minimumVoteAverage === 'string' &&
        form.tmdbConfig.minimumVoteAverage.trim() !== ''
          ? Number(form.tmdbConfig.minimumVoteAverage)
          : null,
      minimumVoteCount:
        form.tmdbConfig.minimumVoteCount &&
        typeof form.tmdbConfig.minimumVoteCount === 'string' &&
        form.tmdbConfig.minimumVoteCount.trim() !== ''
          ? Number(form.tmdbConfig.minimumVoteCount)
          : null,
      minimumPopularity:
        form.tmdbConfig.minimumPopularity &&
        typeof form.tmdbConfig.minimumPopularity === 'string' &&
        form.tmdbConfig.minimumPopularity.trim() !== ''
          ? Number(form.tmdbConfig.minimumPopularity)
          : null,
    },
    radarrInstances: Object.fromEntries(
      form.radarrInstances.map((instance) => [
        instance.id,
        {
          baseUrl: instance.baseUrl,
          apiKey: instance.apiKey,
          qualityProfileId: Number(instance.qualityProfileId),
          tagId0: Number(instance.tagId0),
          rootFolderPath: instance.rootFolderPath,
        },
      ]),
    ),
    rssFeeds: Object.fromEntries(
      form.rssFeeds.map((feed) => [
        feed.id,
        {
          url: feed.url,
          tags: Object.fromEntries(feed.tags.map((tag) => [tag.tagName, tag.patternId])),
        },
      ]),
    ),
    patterns: Object.fromEntries(
      form.patterns.map((pattern) => [
        pattern.id,
        {
          variables: pattern.variables.map((variable) => ({
            name: variable.name,
            from: variable.from === '' || variable.from === undefined ? null : variable.from,
            regex: variable.regex,
            replaceWith: variable.replaceWith,
          })),
          output: pattern.output,
          aliases: pattern.aliases
            ? pattern.aliases
                .split(',')
                .map((alias) => alias.trim())
                .filter((alias) => alias !== '')
            : [],
        },
      ]),
    ),
  };
}

export function convertToForm(settings: Settings): SettingsForm {
  return {
    tmdbConfig: {
      token: settings.tmdbConfig.token,
      minimumVoteAverage: settings.tmdbConfig.minimumVoteAverage?.toString() ?? null,
      minimumVoteCount: settings.tmdbConfig.minimumVoteCount?.toString() ?? null,
      minimumPopularity: settings.tmdbConfig.minimumPopularity?.toString() ?? null,
    },
    radarrInstances: Object.entries(settings.radarrInstances).map(([id, instance]) => ({
      key: UUID(),
      id,
      baseUrl: instance.baseUrl,
      apiKey: instance.apiKey,
      qualityProfileId: String(instance.qualityProfileId),
      tagId0: String(instance.tagId0),
      rootFolderPath: instance.rootFolderPath,
    })),
    rssFeeds: Object.entries(settings.rssFeeds).map(([id, feed]) => ({
      key: UUID(),
      id,
      url: feed.url,
      tags: Object.entries(feed.tags || {}).map(([tagName, patternId]) => ({
        key: UUID(),
        tagName,
        patternId,
      })),
    })),
    patterns: Object.entries(settings.patterns || {}).map(([id, pattern]) => ({
      key: UUID(),
      id,
      variables: pattern.variables.map((variable) => ({
        key: UUID(),
        name: variable.name,
        from: variable.from ?? '',
        regex: variable.regex,
        replaceWith: variable.replaceWith,
      })),
      output: pattern.output,
      aliases: (pattern.aliases || []).join(', '),
    })),
  };
}

export type SelectOption = {
  label: string;
  value: string;
};

export type MapOfSelectOptions = Record<string, SelectOption[]>;

export function convertQualityProfilesToSelectItems(qualityProfiles: RadarrQualityProfileResponse) {
  return qualityProfiles.map((profile) => ({
    label: profile.name,
    value: String(profile.id),
  }));
}

export function convertTagsToSelectItems(tags: RadarrTagResponse) {
  return tags.map((tag) => ({
    label: tag.label,
    value: String(tag.id),
  }));
}

export function convertRootFoldersToSelectItems(rootFolders: RadarrRootFolderResponse) {
  return rootFolders.map((folder) => ({
    label: folder.path,
    value: folder.path,
  }));
}
