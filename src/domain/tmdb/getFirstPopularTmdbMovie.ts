import type { TmdbMovieResult, TmdbMovieSearchResponse } from '~/domain/tmdb/searchTmdbMovie';
import { logger } from '~/logger';
import { searchTmdbMovie } from './searchTmdbMovie';

export async function getFirstPopularTmdbMovie(title: string, year?: number): Promise<TmdbMovieResult | undefined> {
  const data = (await searchTmdbMovie(title, year)) as TmdbMovieSearchResponse;
  const movies = data.results;
  let result = undefined;
  if (Array.isArray(movies) && movies.length > 0) {
    result = movies.sort((a, b) => b?.popularity - a?.popularity)?.[0];
  }
  logger.info(`Query: ${title} ${year ? `year: ${year}` : ''} - Found ${result?.title} with ID ${result?.id}`);
  return result;
}
