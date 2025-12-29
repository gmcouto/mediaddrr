import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getFirstPopularTmdbMovie } from '~/domain/tmdb/getFirstPopularTmdbMovie';
import { getSettings } from '~/domain/settings/util';
import { logger } from '~/logger';
import type { TmdbMovieDetail } from '~/domain/tmdb/types';
import { z } from 'zod';

const MovieQueryRequestSchema = z.object({
  query: z.string().min(1),
  year: z.number().optional(),
});

export type MovieQueryRequest = z.infer<typeof MovieQueryRequestSchema>;

export type FilterCheckResult = {
  passed: boolean;
  message: string;
};

export type MovieQueryResponse = {
  movie: TmdbMovieDetail | null;
  filterChecks: {
    minimumVoteAverage: FilterCheckResult;
    minimumPopularity: FilterCheckResult;
    minimumVoteCount: FilterCheckResult;
  };
  allFiltersPassed: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parseResult = MovieQueryRequestSchema.safeParse(body);
    if (!parseResult.success) {
      logger.error(`Invalid request for Movie Query API: ${JSON.stringify(body)}`);
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }
    const { query, year } = parseResult.data;

    const movie = await getFirstPopularTmdbMovie(query, year);
    if (!movie) {
      return NextResponse.json({
        movie: null,
        filterChecks: {
          minimumVoteAverage: { passed: false, message: 'No movie found' },
          minimumPopularity: { passed: false, message: 'No movie found' },
          minimumVoteCount: { passed: false, message: 'No movie found' },
        },
        allFiltersPassed: false,
      } satisfies MovieQueryResponse);
    }

    // Check filters
    const settings = await getSettings();
    const { minimumVoteAverage, minimumPopularity, minimumVoteCount } = settings.tmdbConfig;

    const filterChecks = {
      minimumVoteAverage: ((): FilterCheckResult => {
        if (minimumVoteAverage === null || minimumVoteAverage === undefined) {
          return { passed: true, message: 'No minimum vote average filter set' };
        }
        const passed = movie.vote_average >= minimumVoteAverage;
        return {
          passed,
          message: passed
            ? `Vote average ${movie.vote_average} meets minimum requirement (${minimumVoteAverage})`
            : `Vote average ${movie.vote_average} does not meet minimum requirement (${minimumVoteAverage})`,
        };
      })(),
      minimumPopularity: ((): FilterCheckResult => {
        if (minimumPopularity === null || minimumPopularity === undefined) {
          return { passed: true, message: 'No minimum popularity filter set' };
        }
        const passed = movie.popularity >= minimumPopularity;
        return {
          passed,
          message: passed
            ? `Popularity ${movie.popularity} meets minimum requirement (${minimumPopularity})`
            : `Popularity ${movie.popularity} does not meet minimum requirement (${minimumPopularity})`,
        };
      })(),
      minimumVoteCount: ((): FilterCheckResult => {
        if (minimumVoteCount === null || minimumVoteCount === undefined) {
          return { passed: true, message: 'No minimum vote count filter set' };
        }
        const passed = movie.vote_count >= minimumVoteCount;
        return {
          passed,
          message: passed
            ? `Vote count ${movie.vote_count} meets minimum requirement (${minimumVoteCount})`
            : `Vote count ${movie.vote_count} does not meet minimum requirement (${minimumVoteCount})`,
        };
      })(),
    };

    const allFiltersPassed =
      filterChecks.minimumVoteAverage.passed &&
      filterChecks.minimumPopularity.passed &&
      filterChecks.minimumVoteCount.passed;

    return NextResponse.json({
      movie,
      filterChecks,
      allFiltersPassed,
    } satisfies MovieQueryResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in Movie Query API: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

