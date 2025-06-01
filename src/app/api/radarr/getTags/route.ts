import { NextResponse, type NextRequest } from 'next/server';
import { getTags } from '~/domain/radarr/getTags';

export async function POST(request: NextRequest) {
  const { baseUrl, apiKey } = (await request.json()) as { baseUrl: string; apiKey: string };
  return NextResponse.json(await getTags({ baseUrl, apiKey }));
}
