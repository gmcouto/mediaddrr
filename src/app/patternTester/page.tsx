'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CenteredContainer } from '~/components/containers/CenteredContainer';
import { PageNavigation } from '~/components/containers/PageNavigation';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { SimpleSelect } from '~/components/form/SimpleSelect';
import { SettingsSchema } from '~/domain/settings/schema';
import type { SelectOption } from '../settings/_util/schema';
import { cn } from '~/lib/utils';

interface PatternTestResult {
  variables: Record<string, string> | null;
  output: string | null;
  error?: string;
}

export default function PatternTesterPage() {
  const [input, setInput] = useState('');
  const [selectedPatternId, setSelectedPatternId] = useState('');

  // Fetch settings to get patterns list
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const json = (await res.json()) as unknown;
      const parsed = SettingsSchema.safeParse(json);
      if (!parsed.success) throw new Error('Invalid settings format');
      return parsed.data;
    },
    refetchOnWindowFocus: false,
  });

  // Test pattern mutation
  const testMutation = useMutation<PatternTestResult, Error, { input: string; patternId: string }>({
    mutationFn: async ({ input, patternId }) => {
      const res = await fetch('/api/patternTester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, patternId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to test pattern');
      }
      return (await res.json()) as PatternTestResult;
    },
  });

  const patternOptions: SelectOption[] =
    settingsData?.patterns
      ? Object.keys(settingsData.patterns)
          .filter((id) => id && id.trim() !== '')
          .map((id) => ({
            label: id,
            value: id,
          }))
      : [];

  const handleTest = () => {
    if (!input.trim() || !selectedPatternId) {
      return;
    }
    testMutation.mutate({ input, patternId: selectedPatternId });
  };

  return (
    <CenteredContainer>
      <PageNavigation currentPath="/patternTester" />
      <h1 className="mb-6 text-2xl font-bold">Pattern Tester</h1>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="input">Input Text</Label>
          <Input
            id="input"
            type="text"
            placeholder="Enter text to test against the pattern"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <SimpleSelect
            name="pattern"
            label="Pattern"
            placeholder={isLoadingSettings ? 'Loading patterns...' : 'Select a pattern'}
            options={patternOptions}
            value={selectedPatternId}
            onChange={setSelectedPatternId}
            required
          />
        </div>

        <Button
          onClick={handleTest}
          disabled={!input.trim() || !selectedPatternId || testMutation.isPending}
          className="w-full"
        >
          {testMutation.isPending ? 'Testing...' : 'Test Pattern'}
        </Button>

        {testMutation.isError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700">{testMutation.error?.message ?? 'Unknown error'}</p>
          </div>
        )}

        {testMutation.isSuccess && testMutation.data && (
          <div className="space-y-4">
            {testMutation.data.error ? (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                <p className="font-semibold text-yellow-800">Warning</p>
                <p className="text-sm text-yellow-700">{testMutation.data.error}</p>
              </div>
            ) : (
              <>
                {testMutation.data.variables && (
                  <div className="rounded-lg border p-4">
                    <h2 className="mb-3 text-lg font-semibold">Variables</h2>
                    <div className="space-y-2">
                      {Object.entries(testMutation.data.variables).map(([key, value]) => (
                        <div key={key} className="flex gap-2 rounded border bg-muted/30 p-2">
                          <span className="font-medium text-muted-foreground">{key}:</span>
                          <span className="flex-1 wrap-break-word">{value || '(empty)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testMutation.data.output !== null && (
                  <div className="rounded-lg border p-4">
                    <h2 className="mb-3 text-lg font-semibold">Output</h2>
                    <div className="rounded border bg-muted/30 p-3">
                      <code className="wrap-break-word text-sm">{testMutation.data.output || '(empty)'}</code>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </CenteredContainer>
  );
}

