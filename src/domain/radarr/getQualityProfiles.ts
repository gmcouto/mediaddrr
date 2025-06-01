import { logger } from '~/logger';

export type RadarrQualityProfile = {
  id: number;
  name: string;
};

export type RadarrQualityProfileResponse = RadarrQualityProfile[];

export async function getQualityProfiles(radarrInstance: { baseUrl: string; apiKey: string }) {
  const response = await fetch(`${radarrInstance.baseUrl}/api/v3/qualityProfile?apikey=${radarrInstance.apiKey}`, {
    method: 'GET',
  });
  if (!response.ok) {
    logger.error(`Failed to get quality profiles: ${response.statusText}`);
    throw new Error(`Failed to get quality profiles: ${response.statusText}`);
  }
  const data = (await response.json()) as RadarrQualityProfileResponse;
  return data;
}
