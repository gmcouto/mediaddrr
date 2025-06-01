import { logger } from '~/logger';

export type RadarrTag = {
  id: number;
  label: string;
};

export type RadarrTagResponse = RadarrTag[];

export async function getTags(radarrInstance: { baseUrl: string; apiKey: string }) {
  const response = await fetch(`${radarrInstance.baseUrl}/api/v3/tag?apikey=${radarrInstance.apiKey}`, {
    method: 'GET',
  });
  if (!response.ok) {
    logger.error(`Failed to get tags: ${response.statusText}`);
    throw new Error(`Failed to get tags: ${response.statusText}`);
  }
  const data = (await response.json()) as RadarrTagResponse;
  return data;
}
