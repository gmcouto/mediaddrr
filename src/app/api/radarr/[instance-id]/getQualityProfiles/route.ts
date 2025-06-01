import { NextResponse, type NextRequest } from 'next/server';
import { getRadarrInstance } from '~/domain/settings/util';
import { logger } from '~/logger';
import { getQualityProfiles } from '~/domain/radarr/getQualityProfiles';

export async function GET(request: NextRequest, { params }: { params: Promise<{ 'instance-id': string }> }) {
  const { 'instance-id': instanceId } = await params;
  const radarrInstance = await getRadarrInstance(instanceId);
  if (!radarrInstance) {
    logger.error(`Radarr instance not found: ${instanceId}`);
    return NextResponse.json({ error: `Radarr instance not found: ${instanceId}` }, { status: 404 });
  }
  const qualityProfiles = await getQualityProfiles(radarrInstance);
  return NextResponse.json(qualityProfiles);
}
