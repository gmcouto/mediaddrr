'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CenteredContainer } from '~/components/containers/CenteredContainer';
import { PageNavigation } from '~/components/containers/PageNavigation';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import type { TmdbMovieDetail } from '~/domain/tmdb/types';
import { cn } from '~/lib/utils';

type FilterCheckResult = {
  passed: boolean;
  message: string;
};

type MovieQueryResponse = {
  movie: TmdbMovieDetail | null;
  filterChecks: {
    minimumVoteAverage: FilterCheckResult;
    minimumPopularity: FilterCheckResult;
    minimumVoteCount: FilterCheckResult;
  };
  allFiltersPassed: boolean;
};

export default function MovieQueryPage() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [yearInput, setYearInput] = useState('');

  const searchMutation = useMutation<MovieQueryResponse, Error, { query: string; year?: number }>({
    mutationFn: async ({ query, year }) => {
      const res = await fetch('/api/movie-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, year }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to search movie');
      }
      return (await res.json()) as MovieQueryResponse;
    },
  });

  const handleYearChange = (value: string) => {
    setYearInput(value);
    const parsed = value.trim() === '' ? undefined : Number.parseInt(value, 10);
    setYear(Number.isNaN(parsed) ? undefined : parsed);
  };

  const handleSearch = () => {
    if (!query.trim()) {
      return;
    }
    searchMutation.mutate({ query: query.trim(), year });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <CenteredContainer>
      <PageNavigation currentPath="/movie-query" />
      <h1 className="mb-6 text-2xl font-bold">Movie Query</h1>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="query">Query</Label>
          <Input
            id="query"
            type="text"
            placeholder="Enter movie title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="year">Year (Optional)</Label>
          <Input
            id="year"
            type="number"
            placeholder="Enter release year"
            value={yearInput}
            onChange={(e) => handleYearChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>

        <Button onClick={handleSearch} disabled={!query.trim() || searchMutation.isPending} className="w-full">
          {searchMutation.isPending ? 'Searching...' : 'Search'}
        </Button>

        {searchMutation.isError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700">{searchMutation.error?.message ?? 'Unknown error'}</p>
          </div>
        )}

        {searchMutation.isSuccess && searchMutation.data && (
          <div className="space-y-4">
            {!searchMutation.data.movie ? (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                <p className="font-semibold text-yellow-800">No Movie Found</p>
                <p className="text-sm text-yellow-700">No movie was found for the given query and year.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border p-4">
                  <h2 className="mb-3 text-lg font-semibold">Movie Information</h2>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Title:</span>
                      <span className="flex-1">{searchMutation.data.movie.title}</span>
                    </div>
                    {searchMutation.data.movie.original_title !== searchMutation.data.movie.title && (
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground">Original Title:</span>
                        <span className="flex-1">{searchMutation.data.movie.original_title}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Release Date:</span>
                      <span className="flex-1">{searchMutation.data.movie.release_date}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">TMDB ID:</span>
                      <span className="flex-1">{searchMutation.data.movie.id}</span>
                    </div>
                    {searchMutation.data.movie.overview && (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-muted-foreground">Overview:</span>
                        <span className="text-sm">{searchMutation.data.movie.overview}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Vote Average:</span>
                      <span className="flex-1">{searchMutation.data.movie.vote_average.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Vote Count:</span>
                      <span className="flex-1">{searchMutation.data.movie.vote_count.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-muted-foreground">Popularity:</span>
                      <span className="flex-1">{searchMutation.data.movie.popularity.toFixed(2)}</span>
                    </div>
                    {searchMutation.data.movie.runtime && (
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground">Runtime:</span>
                        <span className="flex-1">{searchMutation.data.movie.runtime} minutes</span>
                      </div>
                    )}
                    {searchMutation.data.movie.genres && searchMutation.data.movie.genres.length > 0 && (
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground">Genres:</span>
                        <span className="flex-1">{searchMutation.data.movie.genres.map((g) => g.name).join(', ')}</span>
                      </div>
                    )}
                    {searchMutation.data.movie.poster_path && (
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground">Poster:</span>
                        <span className="flex-1">
                          <a
                            href={`https://image.tmdb.org/t/p/w500${searchMutation.data.movie.poster_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Poster
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h2 className="mb-3 text-lg font-semibold">Filter Status</h2>
                  <div
                    className={cn(
                      'mb-3 rounded-lg border p-3',
                      searchMutation.data.allFiltersPassed
                        ? 'border-green-300 bg-green-50'
                        : 'border-yellow-300 bg-yellow-50',
                    )}
                  >
                    <p
                      className={cn(
                        'font-semibold',
                        searchMutation.data.allFiltersPassed ? 'text-green-800' : 'text-yellow-800',
                      )}
                    >
                      {searchMutation.data.allFiltersPassed ? '✓ All Filters Passed' : '⚠ Some Filters Failed'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className={cn(
                        'rounded border p-2',
                        searchMutation.data.filterChecks.minimumVoteAverage.passed
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-red-200 bg-red-50/50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold',
                            searchMutation.data.filterChecks.minimumVoteAverage.passed
                              ? 'text-green-700'
                              : 'text-red-700',
                          )}
                        >
                          {searchMutation.data.filterChecks.minimumVoteAverage.passed ? '✓' : '✗'}
                        </span>
                        <span className="font-medium text-muted-foreground">Minimum Vote Average:</span>
                      </div>
                      <p className="ml-6 text-sm text-muted-foreground">
                        {searchMutation.data.filterChecks.minimumVoteAverage.message}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'rounded border p-2',
                        searchMutation.data.filterChecks.minimumPopularity.passed
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-red-200 bg-red-50/50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold',
                            searchMutation.data.filterChecks.minimumPopularity.passed
                              ? 'text-green-700'
                              : 'text-red-700',
                          )}
                        >
                          {searchMutation.data.filterChecks.minimumPopularity.passed ? '✓' : '✗'}
                        </span>
                        <span className="font-medium text-muted-foreground">Minimum Popularity:</span>
                      </div>
                      <p className="ml-6 text-sm text-muted-foreground">
                        {searchMutation.data.filterChecks.minimumPopularity.message}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'rounded border p-2',
                        searchMutation.data.filterChecks.minimumVoteCount.passed
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-red-200 bg-red-50/50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold',
                            searchMutation.data.filterChecks.minimumVoteCount.passed
                              ? 'text-green-700'
                              : 'text-red-700',
                          )}
                        >
                          {searchMutation.data.filterChecks.minimumVoteCount.passed ? '✓' : '✗'}
                        </span>
                        <span className="font-medium text-muted-foreground">Minimum Vote Count:</span>
                      </div>
                      <p className="ml-6 text-sm text-muted-foreground">
                        {searchMutation.data.filterChecks.minimumVoteCount.message}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </CenteredContainer>
  );
}

