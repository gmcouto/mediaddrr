import { NextResponse } from 'next/server';
import { logger } from '~/logger';

export type AddRadarrMovieRequest = {
  title: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: string;
  isAvailable: boolean;
  tmdbId: number;
  tags: number[];
  addOptions: {
    monitor: string;
    searchForMovie: boolean;
  };
  rootFolderPath: string;
};

export async function addMovie(
  radarrInstance: { baseUrl: string; apiKey: string; qualityProfileId: number; tagId0: number; rootFolderPath: string },
  movie: {
    tmdbId: number;
    title: string;
  },
) {
  const addMovieRequest: AddRadarrMovieRequest = {
    title: movie.title,
    qualityProfileId: radarrInstance.qualityProfileId,
    monitored: true,
    minimumAvailability: 'released',
    isAvailable: true,
    tmdbId: movie.tmdbId,
    tags: [radarrInstance.tagId0],
    addOptions: {
      monitor: 'movieOnly',
      searchForMovie: false,
    },
    rootFolderPath: radarrInstance.rootFolderPath,
  };
  const response = await fetch(`${radarrInstance.baseUrl}/api/v3/movie?apikey=${radarrInstance.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(addMovieRequest),
  });
  if (!response.ok) {
    logger.error(`Radarr response: ${JSON.stringify(response.body)}`);
    return NextResponse.json({ error: `Radarr response: ${JSON.stringify(response.body)}` }, { status: 500 });
  }
  logger.info(`Radarr response: ${JSON.stringify(response.body)}`);
  return response.body;
}
