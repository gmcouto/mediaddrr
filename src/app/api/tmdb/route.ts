import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getFirstPopularTmdbMovie } from '../../../domain/tmdb/getFirstPopularTmdbMovie';
import { z } from 'zod';

const FindMovieRequestSchema = z.object({
  query: z.string(),
  year: z.number().optional(),
});

export type FindMovieRequest = z.infer<typeof FindMovieRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parseResult = FindMovieRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error(parseResult.error);
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }
    const { query, year } = parseResult.data;
    const movie = await getFirstPopularTmdbMovie(query, year);
    return NextResponse.json(movie);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message ?? 'Unknown error' }, { status: 500 });
  }
}
