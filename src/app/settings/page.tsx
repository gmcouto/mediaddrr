'use client';

import React, { useCallback, useState } from 'react';
import { CenteredContainer } from '../../components/containers/CenteredContainer';
import { createFormHook } from '@tanstack/react-form';
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
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { cn } from '~/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsSchema } from '../../domain/settings/schema';
import type { RadarrQualityProfileResponse } from '~/domain/radarr/getQualityProfiles';
import { TextOrSelectField } from './_components/TextOrSelectField';
import type { RadarrTagResponse } from '~/domain/radarr/getTags';
import type { RadarrRootFolderResponse } from '~/domain/radarr/getRootFolders';
import { fieldContext, formContext } from './_util/form';

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
  const [radarrListRef] = useAutoAnimate<HTMLDivElement>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorLoadingOptions, setErrorLoadingOptions] = useState<Record<string, string | null>>({});
  const [qualityProfilesOptions, setQualityProfilesOptions] = useState<MapOfSelectOptions>({});
  const [tagsOptions, setTagsOptions] = useState<MapOfSelectOptions>({});
  const [rootFoldersOptions, setRootFoldersOptions] = useState<MapOfSelectOptions>({});
  const queryClient = useQueryClient();
  const {
    data: fetchedSettings,
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

  const form = useAppForm({
    defaultValues: fetchedSettings ?? {
      tmdbConfig: {
        token: '',
      },
      radarrInstances: [{ id: '', baseUrl: '', apiKey: '', qualityProfileId: '', tagId0: '', rootFolderPath: '' }],
    },
    validators: {
      onChange: SettingsFormSchema,
    },
    onSubmit: (values) => {
      saveMutation.mutate(values.value);
    },
  });

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
            <div className="space-y-6" ref={radarrListRef}>
              {radarrField.state.value.map((_, radarrIndex) => (
                <div key={radarrIndex} className="mb-4 flex flex-col gap-2 rounded-lg border p-4">
                  <form.AppField name={`radarrInstances[${radarrIndex}].id`}>
                    {(_) => <TextField label="Identifier" placeholder="Enter an identifier for the instance" />}
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
            </div>
          </div>
        )}
      </form.Field>
      <form.AppForm>
        <form.SubscribeButton label="Save" className="mt-4 w-full" />
        {submitError && <p className="mt-4 text-red-500">{submitError}</p>}
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
