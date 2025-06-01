import { NextResponse, type NextRequest } from 'next/server';
import { getRootFolders } from '~/domain/radarr/getRootFolders';

export async function POST(request: NextRequest) {
  const { baseUrl, apiKey } = (await request.json()) as { baseUrl: string; apiKey: string };
  return NextResponse.json(await getRootFolders({ baseUrl, apiKey }));
}
