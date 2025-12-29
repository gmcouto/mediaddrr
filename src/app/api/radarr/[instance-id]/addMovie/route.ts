import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRadarrInstance, getSettings } from '~/domain/settings/util';
import { addMovie } from '~/domain/radarr/addMovie';
import { getFirstPopularTmdbMovie } from '~/domain/tmdb/getFirstPopularTmdbMovie';
import { isValidTmdbId } from '~/domain/tmdb/isValidTmdbId';
import { logger } from '~/logger';
import type { TmdbMovieDetail } from '~/domain/tmdb/types';
import { requestBodySchema } from './schema';
import { postRelease } from '~/domain/radarr/postRelease';

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

  // Validate TMDB filters
  const settings = await getSettings();
  const { minimumVoteAverage, minimumPopularity, minimumVoteCount } = settings.tmdbConfig;

  if (minimumVoteAverage !== null && minimumVoteAverage !== undefined) {
    if (tmdbMovie.vote_average < minimumVoteAverage) {
      const errorMessage = `Movie "${tmdbMovie.title}" does not meet minimum vote average requirement: ${tmdbMovie.vote_average} < ${minimumVoteAverage}`;
      logger.warn(errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  }

  if (minimumPopularity !== null && minimumPopularity !== undefined) {
    if (tmdbMovie.popularity < minimumPopularity) {
      const errorMessage = `Movie "${tmdbMovie.title}" does not meet minimum popularity requirement: ${tmdbMovie.popularity} < ${minimumPopularity}`;
      logger.warn(errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  }

  if (minimumVoteCount !== null && minimumVoteCount !== undefined) {
    if (tmdbMovie.vote_count < minimumVoteCount) {
      const errorMessage = `Movie "${tmdbMovie.title}" does not meet minimum vote count requirement: ${tmdbMovie.vote_count} < ${minimumVoteCount}`;
      logger.warn(errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  }

  const radarrInstance = await getRadarrInstance(instanceId);
  if (!radarrInstance) {
    logger.error(`Radarr instance not found: ${instanceId}`);
    return NextResponse.json({ error: `Radarr instance not found: ${instanceId}` }, { status: 404 });
  }
  const addMovieResponse = await addMovie(radarrInstance, {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
  });

  if (data.release) {
    logger.info(`Release has been detected for ${data.release.title}, attempting to push to radarr`);
    try {
      const postReleasePayload = {
        title: data.release.title,
        infoUrl: data.release.infoUrl,
        downloadUrl: data.release.downloadUrl,
        protocol: data.release.protocol,
        publishDate: new Date().toISOString(),
        indexer: data.release.indexer,
        size: data.release.size,
      };

      const postReleaseResponse = await postRelease(radarrInstance, postReleasePayload);

      if (addMovieResponse.ok) {
        logger.info(`Successfully pushed release for "${data.release.title}" to Radarr for instance ${instanceId}`);
        return postReleaseResponse;
      } else {
        logger.error(`Failed to push release to Radarr for ${data.release?.title ?? 'unknown'}: ${addMovieResponse.statusText}`);
      }
    } catch (error) {
      logger.error(
        `Failed to push release to Radarr for ${data.release?.title ?? 'unknown'}: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
      // fail gracefully because it could mean the release wont trump existing quality
    }
  }
  return addMovieResponse;
}
