import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRadarrInstance } from '~/domain/settings/util';
import { getFirstPopularTmdbMovie } from '~/domain/tmdb/getFirstPopularTmdbMovie';
import { logger } from '~/logger';
import { addMovie } from '~/domain/radarr/addMovie';

export async function POST(request: NextRequest, { params }: { params: Promise<{ 'instance-id': string }> }) {
  const { 'instance-id': instanceId } = await params;
  const body: unknown = await request.json();
  const { query, year } = body as { query?: string; year?: number };
  if (typeof query !== 'string' || typeof year !== 'number') {
    logger.error(`Invalid body: query (string) and year (number) is required. ${JSON.stringify(body)}`);
    return NextResponse.json({ error: 'Invalid body: query (string) and year (number) is required.' }, { status: 400 });
  }
  const tmdbMovie = await getFirstPopularTmdbMovie(query, year);
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
