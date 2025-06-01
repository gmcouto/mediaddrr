import { getSettings } from '../settings/util';

export type TmdbMovieResult = {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

export type TmdbMovieSearchResponse = {
  page: number;
  results: TmdbMovieResult[];
  total_pages: number;
  total_results: number;
};

export async function searchTmdbMovie(title: string, year?: number): Promise<Record<string, unknown>> {
  const settings = await getSettings();
  const url = new URL('https://api.themoviedb.org/3/search/movie');
  url.searchParams.append('query', title);
  if (year) {
    url.searchParams.append('primary_release_year', String(year));
  }

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${settings.tmdbConfig.token}`,
    },
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as Record<string, unknown>;
}
