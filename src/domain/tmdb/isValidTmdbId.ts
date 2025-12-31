import { logger } from '~/logger';
import { getTmdbMovieDetail } from './getTmdbMovieDetail';
import type { TmdbMovieDetail } from './types';
import { Ok, Err, type Result } from 'oxide.ts';

export const getYearFromResponse = (response: TmdbMovieDetail) => {
  const yearStr = response.release_date.split('-')[0];
  return parseInt(yearStr ?? '-1', 10);
};

export async function isValidTmdbId(id: string, year: number): Promise<Result<TmdbMovieDetail, string>> {
  try {
    const response = await getTmdbMovieDetail(id);
    const responseYear = getYearFromResponse(response);
    if (response && responseYear && responseYear >= year - 2 && responseYear <= year + 2) {
      response.year = responseYear;
      return Ok(response);
    }
    return Err(`TMDB ID ${id} is not valid for year ${year}`);
  } catch (error) {
    logger.error(`Unknown error validating TMDB ID ${id}`, error);
    return Err(`Unknown error validating TMDB ID ${id}`);
  }
}
