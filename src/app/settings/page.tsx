'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CenteredContainer } from '../../components/containers/CenteredContainer';
import { createFormHook, FormApi } from '@tanstack/react-form';
import { Button } from '~/components/ui/Button';
import { TextField } from './_components/TextField';
import { SubscribeButton } from './_components/SubscribeButton';
import {
  convertQualityProfilesToSelectItems,
  convertRootFoldersToSelectItems,
  convertTagsToSelectItems,
  convertToForm,
  convertToSettings,
  SettingsFormSchema,
  type MapOfSelectOptions,
  type SelectOption,
  type SettingsForm,
} from './_util/schema';
import { SensitiveTextField } from './_components/SensitiveTextField';
import { cn } from '~/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsSchema } from '../../domain/settings/schema';
import type { RadarrQualityProfileResponse } from '~/domain/radarr/getQualityProfiles';
import { TextOrSelectField } from './_components/TextOrSelectField';
import { SelectField } from './_components/SelectField';
import type { RadarrTagResponse } from '~/domain/radarr/getTags';
import type { RadarrRootFolderResponse } from '~/domain/radarr/getRootFolders';
import { fieldContext, formContext } from './_util/form';
import { AnimatedDiv } from '~/components/containers/AnimatedDiv';
import z from 'zod';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

const getQualityProfilesOptions = async (radarrInstance: { baseUrl: string; apiKey: string }) => {
  const qualityProfiles = await fetch(`/api/radarr/getQualityProfiles`, {
    method: 'POST',
    body: JSON.stringify(radarrInstance),
  });
  return convertQualityProfilesToSelectItems((await qualityProfiles.json()) as RadarrQualityProfileResponse);
};

const getTagsOptions = async (radarrInstance: { baseUrl: string; apiKey: string }) => {
  const tags = await fetch(`/api/radarr/getTags`, {
    method: 'POST',
    body: JSON.stringify(radarrInstance),
  });
  return convertTagsToSelectItems((await tags.json()) as RadarrTagResponse);
};

const getRootFoldersOptions = async (radarrInstance: { baseUrl: string; apiKey: string }) => {
  const rootFolders = await fetch(`/api/radarr/getRootFolders`, {
    method: 'POST',
    body: JSON.stringify(radarrInstance),
  });
  return convertRootFoldersToSelectItems((await rootFolders.json()) as RadarrRootFolderResponse);
};

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, SensitiveTextField },
  formComponents: { SubscribeButton },
});

function SettingsFormContent() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorLoadingOptions, setErrorLoadingOptions] = useState<Record<string, string | null>>({});
  const [qualityProfilesOptions, setQualityProfilesOptions] = useState<MapOfSelectOptions>({});
  const [tagsOptions, setTagsOptions] = useState<MapOfSelectOptions>({});
  const [rootFoldersOptions, setRootFoldersOptions] = useState<MapOfSelectOptions>({});
  const [expandedTagsFeeds, setExpandedTagsFeeds] = useState<Set<number>>(new Set());
  const [expandedVariablesPatterns, setExpandedVariablesPatterns] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const {
    data: settingsData,
    isLoading,
    isError,
    error: fetchError,
  } = useQuery<SettingsForm>({
    queryKey: ['settings'],
    queryFn: async () => {
      // await new Promise((resolve) => setTimeout(resolve, 3000));
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const json = (await res.json()) as unknown;
      const parsed = SettingsSchema.safeParse(json);
      if (!parsed.success) throw new Error('Invalid settings format');
      const form = convertToForm(parsed.data);
      return form;
    },
    refetchOnWindowFocus: false,
  });
  const fetchedSettings = settingsData as unknown as SettingsForm;

  const saveMutation = useMutation<boolean, Error, SettingsForm>({
    mutationFn: async (settingsToSave: SettingsForm) => {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertToSettings(settingsToSave)),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save settings');
      }
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  const loadOptions = useCallback(async (radarrInstance: { baseUrl: string; apiKey: string; id: string }) => {
    try {
      const qualityProfiles = await getQualityProfilesOptions({
        baseUrl: radarrInstance.baseUrl,
        apiKey: radarrInstance.apiKey,
      });
      setQualityProfilesOptions((prev) => ({
        ...prev,
        [radarrInstance.id]: qualityProfiles,
      }));
      const tags = await getTagsOptions({
        baseUrl: radarrInstance.baseUrl,
        apiKey: radarrInstance.apiKey,
      });
      setTagsOptions((prev) => ({
        ...prev,
        [radarrInstance.id]: tags,
      }));
      const rootFolders = await getRootFoldersOptions({
        baseUrl: radarrInstance.baseUrl,
        apiKey: radarrInstance.apiKey,
      });
      setRootFoldersOptions((prev) => ({
        ...prev,
        [radarrInstance.id]: rootFolders,
      }));
      setErrorLoadingOptions((prev) => ({
        ...prev,
        [radarrInstance.id]: null,
      }));
    } catch (error) {
      setErrorLoadingOptions((prev) => ({
        ...prev,
        [radarrInstance.id]: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  const DEFAULT_FORM: SettingsForm = {
    tmdbConfig: {
      token: '',
    },
    radarrInstances: [],
    rssFeeds: [],
    patterns: [],
  };

  const form = useAppForm({
    defaultValues: fetchedSettings || DEFAULT_FORM,
    validators: {
      onBlur: SettingsFormSchema,
      onSubmit: SettingsFormSchema,
    },
    onSubmit: (values) => {
      saveMutation.mutate(values.value);
    },
  });

  // Expand all tags sections by default when form data is loaded
  useEffect(() => {
    if (Array.isArray(form.state.values.rssFeeds)) {
      const allFeedIndices = new Set(form.state.values.rssFeeds.map((_, index) => index));
      setExpandedTagsFeeds(allFeedIndices);
    }
  }, [form.state.values.rssFeeds]);

  if (isLoading) {
    return <SettingsLoading />;
  }

  if (isError) {
    return (
      <CenteredContainer>
        <div className="w-full text-center">
          <h1 className="mb-6 text-2xl font-bold">Error</h1>
          <div className="mb-4 font-medium">{fetchError?.message ?? 'Unknown error'}</div>
          <Button onClick={() => void queryClient.invalidateQueries({ queryKey: ['settings'] })} variant="outline">
            Retry
          </Button>
        </div>
      </CenteredContainer>
    );
  }

  return (
    <CenteredContainer>
      <div className="mb-4 flex justify-end">
        <Link href="/patternTester">
          <Button variant="outline" size="sm">
            Pattern Tester
          </Button>
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div>
        <h3 className="text-2l mb-4 font-bold">TMDB</h3>
        <form.AppField name="tmdbConfig.token">
          {(_) => (
            <SensitiveTextField
              label="Token"
              placeholder="Enter your TMDB token"
              toggleHideLabel="Hide"
              toggleShowLabel="Show"
              hidePasswordMessage="Hide Token"
              showPasswordMessage="Show Token"
            />
          )}
        </form.AppField>
      </div>

      <form.Field name="radarrInstances">
        {(radarrField) => (
          <div>
            <h3 className="text-2l mb-4 pt-4 font-bold">Radarr Instances</h3>
            <AnimatedDiv className="space-y-6">
              {(Array.isArray(radarrField.state.value) ? radarrField.state.value : []).map((_, radarrIndex) => (
                <div
                  key={radarrField.state?.value?.[radarrIndex]?.key}
                  className="mb-4 flex flex-col gap-2 rounded-lg border p-4"
                >
                  <form.AppField name={`radarrInstances[${radarrIndex}].id`}>
                    {(_) => (
                      <TextField label="Instance Identifier" placeholder="Enter an identifier for the instance" />
                    )}
                  </form.AppField>
                  <form.AppField name={`radarrInstances[${radarrIndex}].baseUrl`}>
                    {(_) => <TextField label="Base URL" placeholder="Enter the base URL for the instance" />}
                  </form.AppField>
                  <form.AppField name={`radarrInstances[${radarrIndex}].apiKey`}>
                    {(_) => (
                      <SensitiveTextField
                        label="API Key"
                        placeholder="Enter the API key for the instance"
                        toggleHideLabel="Hide"
                        toggleShowLabel="Show"
                        hidePasswordMessage="Hide API Key"
                        showPasswordMessage="Show API Key"
                      />
                    )}
                  </form.AppField>
                  <Button
                    type="button"
                    variant="default"
                    onClick={async () => {
                      const instance = radarrField.state.value[radarrIndex];
                      if (!instance) return;
                      await loadOptions(instance);
                    }}
                    className={cn('mt-2 border-none bg-blue-950 text-white hover:bg-blue-900')}
                  >
                    Load Options
                  </Button>
                  {errorLoadingOptions[radarrField.state?.value?.[radarrIndex]?.id ?? -1] && (
                    <p className="text-red-500">
                      {errorLoadingOptions[radarrField.state?.value?.[radarrIndex]?.id ?? -1]}
                    </p>
                  )}
                  <form.AppField name={`radarrInstances[${radarrIndex}].qualityProfileId`}>
                    {(_) => (
                      <TextOrSelectField
                        label="Quality Profile"
                        selectPlaceholder="Select the quality profile for the instance"
                        textPlaceholder="Enter the quality profile ID for the instance"
                        options={
                          qualityProfilesOptions?.[radarrField.state?.value?.[radarrIndex]?.id ?? -1] as SelectOption[]
                        }
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`radarrInstances[${radarrIndex}].tagId0`}>
                    {(_) => (
                      <TextOrSelectField
                        label="Tag"
                        selectPlaceholder="Select the tag for the instance"
                        textPlaceholder="Enter the tag ID for the instance"
                        options={tagsOptions?.[radarrField.state?.value?.[radarrIndex]?.id ?? -1] as SelectOption[]}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name={`radarrInstances[${radarrIndex}].rootFolderPath`}>
                    {(_) => (
                      <TextOrSelectField
                        label="Root Folder"
                        selectPlaceholder="Select the root folder for the instance"
                        textPlaceholder="Enter the root folder path for the instance"
                        options={
                          rootFoldersOptions?.[radarrField.state?.value?.[radarrIndex]?.id ?? -1] as SelectOption[]
                        }
                      />
                    )}
                  </form.AppField>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => radarrField.removeValue(radarrIndex)}
                    className={cn('mt-2 border-none bg-red-950 text-white hover:bg-red-900')}
                  >
                    Remove Instance
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="default"
                onClick={() =>
                  radarrField.pushValue({
                    key: crypto.randomUUID(),
                    id: '',
                    baseUrl: '',
                    apiKey: '',
                    qualityProfileId: '',
                    tagId0: '',
                    rootFolderPath: '',
                  })
                }
                className={cn('mt-2 w-full border-none bg-green-950 text-white hover:bg-green-900')}
              >
                Add Radarr Instance
              </Button>
            </AnimatedDiv>
          </div>
        )}
      </form.Field>

      <form.Field name="rssFeeds">
        {(rssFeedsField) => (
          <div>
            <h3 className="text-2l mb-4 pt-4 font-bold">RSS Feeds</h3>
            <AnimatedDiv className="space-y-6">
              {(Array.isArray(rssFeedsField.state.value) ? rssFeedsField.state.value : []).map((feed, feedIndex) => (
                <div key={feed.key} className="mb-4 flex flex-col gap-2 rounded-lg border p-4">
                  <form.AppField name={`rssFeeds[${feedIndex}].id`}>
                    {(_) => <TextField label="Feed Identifier" placeholder="Enter a name for this RSS feed" />}
                  </form.AppField>
                  <form.AppField name={`rssFeeds[${feedIndex}].url`}>
                    {(_) => (
                      <SensitiveTextField
                        label="Feed URL"
                        placeholder="Enter the RSS feed URL"
                        toggleHideLabel="Hide"
                        toggleShowLabel="Show"
                        hidePasswordMessage="Hide Feed URL"
                        showPasswordMessage="Show Feed URL"
                      />
                    )}
                  </form.AppField>
                  <div>
                    <form.Field name={`rssFeeds[${feedIndex}].tags`}>
                      {(tagsField) => {
                        const isExpanded = expandedTagsFeeds.has(feedIndex);
                        const tagCount = tagsField.state.value.length;
                        return (
                          <>
                            <div className="mb-2 flex items-center justify-between">
                              <label className="block font-medium">
                                Tags {tagCount > 0 && <span className="text-muted-foreground">({tagCount})</span>}
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setExpandedTagsFeeds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(feedIndex)) {
                                      next.delete(feedIndex);
                                    } else {
                                      next.add(feedIndex);
                                    }
                                    return next;
                                  });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="size-4" />
                                ) : (
                                  <ChevronDownIcon className="size-4" />
                                )}
                              </Button>
                            </div>
                            {isExpanded && (
                              <AnimatedDiv className="space-y-4">
                                {(Array.isArray(tagsField.state.value) ? tagsField.state.value : []).map((tag, tagIndex) => (
                                  <div key={tag.key} className="flex gap-2 rounded-lg border p-4">
                                    <div className="flex-1">
                                      <form.AppField name={`rssFeeds[${feedIndex}].tags[${tagIndex}].tagName`}>
                                        {(_) => <TextField label="Tag Name" placeholder="Enter XML tag name" />}
                                      </form.AppField>
                                    </div>
                                    <div className="flex-1">
                                      <form.AppField name={`rssFeeds[${feedIndex}].tags[${tagIndex}].patternId`}>
                                        {(_) => (
                                          <form.Subscribe selector={(state) => state.values.patterns}>
                                            {(patterns) => {
                                              const patternOptions: SelectOption[] = (patterns || [])
                                                .filter((pattern) => pattern.id && pattern.id.trim() !== '')
                                                .map((pattern) => ({
                                                  label: pattern.id,
                                                  value: pattern.id,
                                                }));
                                              return (
                                                <SelectField
                                                  label="Pattern"
                                                  placeholder="Select a pattern"
                                                  options={patternOptions}
                                                />
                                              );
                                            }}
                                          </form.Subscribe>
                                        )}
                                      </form.AppField>
                                    </div>
                                    <div className="flex items-end pb-0.5">
                                      <Button
                                        type="button"
                                        variant="default"
                                        onClick={() => tagsField.removeValue(tagIndex)}
                                        className={cn('h-9 border-none bg-red-950 text-white hover:bg-red-900')}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() =>
                                    tagsField.pushValue({
                                      key: crypto.randomUUID(),
                                      tagName: '',
                                      patternId: '',
                                    })
                                  }
                                  className={cn('border-none bg-green-950 text-white hover:bg-green-900')}
                                >
                                  Add Tag
                                </Button>
                              </AnimatedDiv>
                            )}
                          </>
                        );
                      }}
                    </form.Field>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => rssFeedsField.removeValue(feedIndex)}
                    className={cn('mt-2 border-none bg-red-950 text-white hover:bg-red-900')}
                  >
                    Remove Feed
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="default"
                onClick={() =>
                  rssFeedsField.pushValue({
                    key: crypto.randomUUID(),
                    id: '',
                    url: '',
                    tags: [],
                  })
                }
                className={cn('mt-2 w-full border-none bg-green-950 text-white hover:bg-green-900')}
              >
                Add RSS Feed
              </Button>
            </AnimatedDiv>
          </div>
        )}
      </form.Field>

      <form.Field name="patterns">
        {(patternsField) => (
          <div>
            <h3 className="text-2l mb-4 pt-4 font-bold">Patterns</h3>
            <AnimatedDiv className="space-y-6">
              {(Array.isArray(patternsField.state.value) ? patternsField.state.value : []).map((pattern, patternIndex) => (
                <div key={pattern.key} className="mb-4 flex flex-col gap-2 rounded-lg border p-4">
                  <form.AppField name={`patterns[${patternIndex}].id`}>
                    {(_) => <TextField label="Pattern Identifier" placeholder="Enter a name for this pattern" />}
                  </form.AppField>
                  <form.AppField name={`patterns[${patternIndex}].output`}>
                    {(_) => <TextField label="Output Template" placeholder="Enter output template" />}
                  </form.AppField>
                  <div>
                    <form.Field name={`patterns[${patternIndex}].variables`}>
                      {(variablesField) => {
                        const patternKey = pattern.key || `pattern-${patternIndex}`;
                        const isExpanded = expandedVariablesPatterns.has(patternKey);
                        const variableCount = variablesField.state.value.length;
                        return (
                          <>
                            <div className="mb-2 flex items-center justify-between">
                              <label className="block font-medium">
                                Variables{' '}
                                {variableCount > 0 && (
                                  <span className="text-muted-foreground">({variableCount})</span>
                                )}
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setExpandedVariablesPatterns((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(patternKey)) {
                                      next.delete(patternKey);
                                    } else {
                                      next.add(patternKey);
                                    }
                                    return next;
                                  });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="size-4" />
                                ) : (
                                  <ChevronDownIcon className="size-4" />
                                )}
                              </Button>
                            </div>
                            {isExpanded && (
                              <AnimatedDiv className="space-y-3">
                                {(Array.isArray(variablesField.state.value) ? variablesField.state.value : []).map((variable, variableIndex) => (
                            <div
                              key={variable.key /* must use key for reorder */}
                              className="rounded border p-3"
                            >
                              <form.AppField
                                name={`patterns[${patternIndex}].variables[${variableIndex}].name`}
                              >
                                {(_) => (
                                  <TextField
                                    label="Variable Name"
                                    placeholder="Enter variable name to persist to"
                                  />
                                )}
                              </form.AppField>
                              <form.AppField
                                name={`patterns[${patternIndex}].variables[${variableIndex}].from`}
                              >
                                {(_) => (
                                  <TextField
                                    label="Base Var"
                                    placeholder="Enter source variable name or leave empty to use source text"
                                  />
                                )}
                              </form.AppField>
                              <form.AppField
                                name={`patterns[${patternIndex}].variables[${variableIndex}].regex`}
                              >
                                {(_) => (
                                  <TextField label="Regex Pattern" placeholder="Enter regex pattern" />
                                )}
                              </form.AppField>
                              <form.AppField
                                name={`patterns[${patternIndex}].variables[${variableIndex}].replaceWith`}
                              >
                                {(_) => (
                                  <TextField label="Replace With" placeholder="Enter replacement string" />
                                )}
                              </form.AppField>
                              <div className="mt-2 flex gap-2">
                                {variableIndex > 0 && (
                                  <Button
                                    type="button"
                                    variant="default"
                                    onClick={() => {
                                      const current = variablesField.state.value[variableIndex];
                                      const previous = variablesField.state.value[variableIndex - 1];
                                      if (!current || !previous) return;
                                      variablesField.setValue((prev) => {
                                        const newValue = [...prev];
                                        newValue[variableIndex - 1] = current;
                                        newValue[variableIndex] = previous;
                                        return newValue;
                                      });
                                    }}
                                    className={cn(
                                      'flex-1 border-none bg-blue-950 text-white hover:bg-blue-900',
                                    )}
                                  >
                                    Move Up
                                  </Button>
                                )}
                                {variableIndex < variablesField.state.value.length - 1 && (
                                  <Button
                                    type="button"
                                    variant="default"
                                    onClick={() => {
                                      const current = variablesField.state.value[variableIndex];
                                      const next = variablesField.state.value[variableIndex + 1];
                                      if (!current || !next) return;
                                      variablesField.setValue((prev) => {
                                        const newValue = [...prev];
                                        newValue[variableIndex] = next;
                                        newValue[variableIndex + 1] = current;
                                        return newValue;
                                      });
                                    }}
                                    className={cn(
                                      'flex-1 border-none bg-blue-950 text-white hover:bg-blue-900',
                                    )}
                                  >
                                    Move Down
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() => variablesField.removeValue(variableIndex)}
                                  className={cn('flex-1 border-none bg-red-950 text-white hover:bg-red-900')}
                                >
                                  Remove Variable
                                </Button>
                              </div>
                            </div>
                          ))}
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() =>
                                    variablesField.pushValue({
                                      key: crypto.randomUUID(),
                                      name: '',
                                      from: '',
                                      regex: '',
                                      replaceWith: '',
                                    })
                                  }
                                  className={cn('border-none bg-green-950 text-white hover:bg-green-900')}
                                >
                                  Add Variable
                                </Button>
                              </AnimatedDiv>
                            )}
                          </>
                        );
                      }}
                    </form.Field>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => patternsField.removeValue(patternIndex)}
                    className={cn('mt-2 border-none bg-red-950 text-white hover:bg-red-900')}
                  >
                    Remove Pattern
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="default"
                onClick={() =>
                  patternsField.pushValue({
                    key: crypto.randomUUID(),
                    id: '',
                    variables: [],
                    output: '',
                  })
                }
                className={cn('mt-2 w-full border-none bg-green-950 text-white hover:bg-green-900')}
              >
                Add Pattern
              </Button>
            </AnimatedDiv>
          </div>
        )}
      </form.Field>

      <form.AppForm>
        <form.SubscribeButton label="Save" className="mt-4 w-full" />
        {submitError && <p className="mt-4 text-red-500">{submitError}</p>}
        {form.state.errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="mb-2 font-semibold text-red-800">Form Validation Errors:</p>
            <ul className="list-inside list-disc text-sm text-red-700">
              {form.state.errors.map((error, index) => (
                <li key={index}>{JSON.stringify(error)}</li>
              ))}
            </ul>
          </div>
        )}
      </form.AppForm>
    </CenteredContainer>
  );
}

function SettingsLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <span className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      <span className="ml-4 text-lg font-medium text-gray-600">Loading settings...</span>
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsFormContent />;
}
