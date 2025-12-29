import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSettings } from '../../../domain/settings/util';
import { processVariables, processOutput } from '../../../domain/rss/tagProcessor';
import { logger } from '~/logger';
import { z } from 'zod';

const PatternTesterRequestSchema = z.object({
  input: z.string(),
  patternId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = PatternTesterRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { input, patternId } = parsed.data;

    // Load settings to get patterns
    const settings = await getSettings();
    const pattern = settings.patterns[patternId];

    if (!pattern) {
      return NextResponse.json({ error: `Pattern "${patternId}" not found` }, { status: 404 });
    }

    // Process variables
    const variables = await processVariables(input, pattern);

    if (!variables) {
      return NextResponse.json(
        {
          error: 'Pattern processing failed - first variable did not match',
          variables: null,
          output: null,
        },
        { status: 200 },
      );
    }

    // Process output
    const output = await processOutput(pattern.output, variables);

    return NextResponse.json({
      variables,
      output,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Pattern tester error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}




