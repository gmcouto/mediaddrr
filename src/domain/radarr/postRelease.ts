import { logger } from '~/logger';
import { getPatternWithAlias } from '../settings/util';
import type { Pattern } from '../settings/schema';
import { processOutput, processVariables } from '../rss/tagProcessor';
import { NextResponse } from 'next/server';

export type PostRadarrReleaseRequest = {
  title: string;
  infoUrl?: string;
  downloadUrl?: string;
  magnetUrl?: string;
  protocol: string;
  publishDate: string;
  indexer: string;
  size: number;
  tmdbId?: number;
};

export async function postRelease(
  radarrInstance: { baseUrl: string; apiKey: string },
  release: PostRadarrReleaseRequest,
) {
  let pattern: Pattern | undefined;
  try {
    pattern = await getPatternWithAlias(release.indexer);
  } catch (error) {
    logger.debug(`There is no pattern with alias: ${release.indexer}, not processing variables`);
  }
  
  if (pattern) {
    const variables = await processVariables(release.title, pattern);
    if (variables) {
      const output = await processOutput(pattern.output, variables);
      if (output) {
        logger.debug(`Processed title: ${release.title} -> ${output}`);
        release.title = output;
      }
    }
  }

  const response = await fetch(`${radarrInstance.baseUrl}/api/v3/release/push?apikey=${radarrInstance.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(release),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Failed to post release to Radarr: ${response.status} ${response.statusText}. Response: ${errorText}`);
    return NextResponse.json({ error: `Failed to post release to Radarr: ${response.status} ${response.statusText}` }, { status: 500 });
  }

  const data = await response.json();
  logger.info(`Successfully posted release to Radarr: ${release.title}, \n request: ${JSON.stringify(release)} \n response: ${JSON.stringify(data)}`);
  return NextResponse.json(data);
}

