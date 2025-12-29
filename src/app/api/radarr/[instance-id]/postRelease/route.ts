import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRadarrInstance } from '~/domain/settings/util';
import { postRelease } from '~/domain/radarr/postRelease';
import { logger } from '~/logger';
import { requestBodySchema } from './schema';

export async function POST(request: NextRequest, { params }: { params: Promise<{ 'instance-id': string }> }) {
  const { 'instance-id': instanceId } = await params;
  const body: unknown = await request.json();
  const { success, data } = requestBodySchema.safeParse(body);
  if (!success) {
    logger.error(`Invalid body: ${JSON.stringify(body)}`);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const radarrInstance = await getRadarrInstance(instanceId);
  if (!radarrInstance) {
    logger.error(`Radarr instance not found: ${instanceId}`);
    return NextResponse.json({ error: `Radarr instance not found: ${instanceId}` }, { status: 404 });
  }

  try {
    const postReleaseResponse = await postRelease(radarrInstance, {
      title: data.title,
      infoUrl: data.infoUrl,
      downloadUrl: data.downloadUrl,
      magnetUrl: data.magnetUrl,
      protocol: data.protocol,
      publishDate: new Date().toISOString(),
      indexer: data.indexer,
      size: data.size,
    });
    return postReleaseResponse;
  } catch (error) {
    logger.error(`Failed to post release: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post release' },
      { status: 500 },
    );
  }
}
