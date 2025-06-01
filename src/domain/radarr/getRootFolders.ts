import { logger } from '~/logger';

export type RadarrRootFolder = {
  id: number;
  path: string;
};

export type RadarrRootFolderResponse = RadarrRootFolder[];

export async function getRootFolders(radarrInstance: { baseUrl: string; apiKey: string }) {
  const response = await fetch(`${radarrInstance.baseUrl}/api/v3/rootfolder?apikey=${radarrInstance.apiKey}`, {
    method: 'GET',
  });
  if (!response.ok) {
    logger.error(`Failed to get root folders: ${response.statusText}`);
    throw new Error(`Failed to get root folders: ${response.statusText}`);
  }
  const data = (await response.json()) as RadarrRootFolderResponse;
  return data;
}
