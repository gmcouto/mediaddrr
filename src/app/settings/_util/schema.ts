import z from 'zod';
import type { RadarrQualityProfileResponse } from '~/domain/radarr/getQualityProfiles';
import type { Settings } from '~/domain/settings/schema';
import type { RadarrTagResponse } from '~/domain/radarr/getTags';
import type { RadarrRootFolderResponse } from '~/domain/radarr/getRootFolders';

export const TmdbConfigFormSchema = z.object({
  token: z.string().trim().nonempty('Token is required'),
});
export type TmdbConfig = z.infer<typeof TmdbConfigFormSchema>;

export const RadarrConfigFormSchema = z.object({
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

export const SettingsFormSchema = z.object({
  tmdbConfig: TmdbConfigFormSchema,
  radarrInstances: z.array(RadarrConfigFormSchema),
});
export type SettingsForm = z.infer<typeof SettingsFormSchema>;

export function convertToSettings(form: SettingsForm): Settings {
  return {
    tmdbConfig: form.tmdbConfig,
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
  };
}

export function convertToForm(settings: Settings): SettingsForm {
  return {
    tmdbConfig: settings.tmdbConfig,
    radarrInstances: Object.entries(settings.radarrInstances).map(([id, instance]) => ({
      id,
      baseUrl: instance.baseUrl,
      apiKey: instance.apiKey,
      qualityProfileId: String(instance.qualityProfileId),
      tagId0: String(instance.tagId0),
      rootFolderPath: instance.rootFolderPath,
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
