import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRadarrInstance } from '~/domain/settings/util';
import { addMovie } from '~/domain/radarr/addMovie';
import { getFirstPopularTmdbMovie } from '~/domain/tmdb/getFirstPopularTmdbMovie';
import { isValidTmdbId } from '~/domain/tmdb/isValidTmdbId';
import { logger } from '~/logger';
import type { TmdbMovieDetail } from '~/domain/tmdb/types';

export const requestBodySchema = z.object({
  query: z.string(),
  year: z.number().transform((val) => (typeof val === 'number' ? val : parseInt(val, 10))),
  tmdbId: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => String(val).trim()),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ 'instance-id': string }> }) {
  const { 'instance-id': instanceId } = await params;
  const body: unknown = await request.json();
  const { success, data } = requestBodySchema.safeParse(body);
  if (!success) {
    logger.error(`Invalid body: ${JSON.stringify(body)}`);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const { query, year, tmdbId } = data;
  let tmdbMovie: TmdbMovieDetail | undefined;
  if (tmdbId) {
    const result = await isValidTmdbId(tmdbId, year);
    if (result.isErr()) {
      logger.error(`TMDB ID ${tmdbId} is not valid for year ${year}`);
      return NextResponse.json({ error: result.unwrapErr() }, { status: 400 });
    }
    tmdbMovie = result.unwrap();
    logger.info(
      `TMDB ID ${tmdbId} is valid for year ${year}. Found movie: ${tmdbMovie.title} (${tmdbMovie.release_date})`,
    );
  }
  tmdbMovie ??= await getFirstPopularTmdbMovie(query, year);
  if (!tmdbMovie) {
    logger.error(`No movie found for query: ${query} and year: ${year}`);
    return NextResponse.json({ error: `No movie found for query: ${query} and year: ${year}` }, { status: 404 });
  }
  const radarrInstance = await getRadarrInstance(instanceId);
  if (!radarrInstance) {
    logger.error(`Radarr instance not found: ${instanceId}`);
    return NextResponse.json({ error: `Radarr instance not found: ${instanceId}` }, { status: 404 });
  }
  const response = await addMovie(radarrInstance, {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
  });
  return NextResponse.json(response);
}
