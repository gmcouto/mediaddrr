import { NextResponse, type NextRequest } from 'next/server';
import { getQualityProfiles } from '~/domain/radarr/getQualityProfiles';

export async function POST(request: NextRequest) {
  const { baseUrl, apiKey } = (await request.json()) as { baseUrl: string; apiKey: string };
  return NextResponse.json(await getQualityProfiles({ baseUrl, apiKey }));
}
