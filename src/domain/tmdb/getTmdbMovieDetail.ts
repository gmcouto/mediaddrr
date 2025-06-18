import { getSettings } from '../settings/util';
import type { TmdbMovieDetail } from './types';

/**
 * Function to find movie in TMDB using the id
 * @param id - TMDB movie id
 */
export async function getTmdbMovieDetail(id: string): Promise<TmdbMovieDetail> {
  const settings = await getSettings();
  const url = new URL(`https://api.themoviedb.org/3/movie/${id}`);
  url.searchParams.append('language', 'en-US');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${settings.tmdbConfig.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as TmdbMovieDetail;
  if (!data.id) {
    throw new Error(`Invalid TMDB movie detail: ${JSON.stringify(data)}`);
  }
  return data;
}
